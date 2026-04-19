#!/usr/bin/env bash
# VM startup script for the Searchlyst staging VM.
# Runs once at first boot, and again whenever you re-trigger the metadata script
# runner (`sudo google_metadata_script_runner startup`).
#
# Idempotent: re-running is safe.
#
# Installs:
#   - Docker Engine + docker compose plugin
#   - host nginx (HTTP only on :80, proxies / → 127.0.0.1:8080 and /api → 127.0.0.1:3000)
#   - /opt/searchlyst directory + ownership for the deploy workflow
#
# TLS is intentionally NOT configured here. Run infra/gcp/setup-tls.sh later,
# once you've pointed a domain at this VM's public IP.

set -euo pipefail

LOG=/var/log/searchlyst-startup.log
exec > >(tee -a "$LOG") 2>&1
echo "[$(date -Iseconds)] vm-startup.sh begin"

export DEBIAN_FRONTEND=noninteractive

# ───────── Base packages ──────────────────────────────────────────────────────
apt-get update -y
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release nginx jq

# ───────── Docker Engine ──────────────────────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi

# Configure Docker to authenticate with Artifact Registry using the VM's attached SA
AR_LOCATION="$(curl -fsS -H 'Metadata-Flavor: Google' \
  http://metadata.google.internal/computeMetadata/v1/instance/attributes/artifact-registry-location 2>/dev/null || echo asia-south1)"
mkdir -p /root/.docker
cat > /root/.docker/config.json <<JSON
{
  "credHelpers": {
    "${AR_LOCATION}-docker.pkg.dev": "gcloud"
  }
}
JSON

# Make `docker` and `gcloud` work for any OS Login user that's added to the docker group
groupadd -f docker

# ───────── App directory ──────────────────────────────────────────────────────
mkdir -p /opt/searchlyst
chmod 755 /opt/searchlyst

# ───────── nginx site (HTTP only) ─────────────────────────────────────────────
cat > /etc/nginx/sites-available/searchlyst <<'NGINX'
# HTTP-only staging config.
# Run infra/gcp/setup-tls.sh after pointing a domain at this VM to upgrade to HTTPS.

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    # Forward Host as-is so the app sees the originating hostname (IP or future domain)
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    client_max_body_size 25m;

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    # Backend health check (top-level)
    location = /health {
        proxy_pass http://127.0.0.1:3000/health;
    }

    # Frontend SPA (served by the searchlyst-ui container's nginx on :8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
NGINX

# Enable site, drop default
ln -sf /etc/nginx/sites-available/searchlyst /etc/nginx/sites-enabled/searchlyst
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl start nginx

echo "[$(date -Iseconds)] vm-startup.sh complete"
