#!/usr/bin/env bash
# Add Let's Encrypt TLS to the staging VM, run *on the VM* (not on your laptop).
#
# Prereq: an A record for ${STAGING_DOMAIN} pointing at this VM's public IP,
# and DNS propagation completed (test with: dig +short ${STAGING_DOMAIN}).
#
# Usage from your laptop:
#   gcloud compute scp --tunnel-through-iap --zone=$GCP_ZONE \
#     infra/gcp/setup-tls.sh $GCP_VM_NAME:/tmp/
#   gcloud compute ssh --tunnel-through-iap --zone=$GCP_ZONE $GCP_VM_NAME \
#     --command='sudo STAGING_DOMAIN=staging.example.com LE_EMAIL=you@example.com bash /tmp/setup-tls.sh'
#
# After this completes, also update the FRONTEND_URL GitHub secret to the new https URL.

set -euo pipefail

: "${STAGING_DOMAIN:?Set STAGING_DOMAIN env var (e.g. staging.example.com)}"
: "${LE_EMAIL:?Set LE_EMAIL env var (used by Let's Encrypt for renewal notices)}"

if [[ "$EUID" -ne 0 ]]; then
  echo "This script must be run as root (use sudo)." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y --no-install-recommends certbot python3-certbot-nginx

# Update server_name on the existing site so certbot can find it
NGINX_SITE=/etc/nginx/sites-available/searchlyst
if [[ ! -f "$NGINX_SITE" ]]; then
  echo "$NGINX_SITE not found — has vm-startup.sh run on this VM?" >&2
  exit 1
fi

sed -i "s/server_name _;/server_name ${STAGING_DOMAIN};/" "$NGINX_SITE"
nginx -t
systemctl reload nginx

# Issue + install cert; certbot will edit the site config to add :443 + redirect :80
certbot --nginx \
  --non-interactive --agree-tos \
  --email "$LE_EMAIL" \
  --domains "$STAGING_DOMAIN" \
  --redirect

systemctl reload nginx

# Verify auto-renewal timer is enabled (installed automatically by the certbot package)
systemctl enable --now certbot.timer
systemctl list-timers | grep -i certbot || true

cat <<EOF

═══════════════════════════════════════════════════════════════════════════════
  TLS enabled for https://${STAGING_DOMAIN}/
═══════════════════════════════════════════════════════════════════════════════
  Cert auto-renewal:   systemctl status certbot.timer
  Manual renewal test: sudo certbot renew --dry-run

  Don't forget to:
    1. Update the FRONTEND_URL GitHub secret to https://${STAGING_DOMAIN}
    2. Re-run the 'Deploy to Staging' workflow so the API picks up the new origin.
═══════════════════════════════════════════════════════════════════════════════
EOF
