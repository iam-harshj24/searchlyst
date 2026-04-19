#!/usr/bin/env bash
# One-time bootstrap: create the GCS bucket that holds Terraform state.
#
# Terraform itself can't create the bucket where it stores its own state
# (chicken-and-egg), so we make it here with a few gcloud commands.
#
# Run this once per project, BEFORE the first `terraform init` for any environment.
#
# Usage:
#   export GCP_PROJECT_ID=your-project-id
#   bash infra/terraform/bootstrap-state-bucket.sh

set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
LOCATION="${GCP_REGION:-asia-south1}"
BUCKET="${TF_STATE_BUCKET:-${GCP_PROJECT_ID}-tfstate}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

log "Ensuring storage API is enabled"
gcloud services enable storage.googleapis.com --quiet

if gcloud storage buckets describe "gs://${BUCKET}" >/dev/null 2>&1; then
  log "Bucket gs://${BUCKET} already exists - skipping"
else
  log "Creating gs://${BUCKET} in ${LOCATION}"
  gcloud storage buckets create "gs://${BUCKET}" \
    --location="$LOCATION" \
    --uniform-bucket-level-access \
    --public-access-prevention
fi

log "Enabling object versioning (allows state history / rollback)"
gcloud storage buckets update "gs://${BUCKET}" --versioning

log "Enabling lifecycle: keep latest + 5 prior versions, delete older"
TMP_LIFECYCLE="$(mktemp)"
cat > "$TMP_LIFECYCLE" <<JSON
{
  "lifecycle": {
    "rule": [
      { "action": { "type": "Delete" },
        "condition": { "numNewerVersions": 6 } }
    ]
  }
}
JSON
gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file="$TMP_LIFECYCLE"
rm -f "$TMP_LIFECYCLE"

cat <<EOF

═══════════════════════════════════════════════════════════════════════════════
  State bucket ready: gs://${BUCKET}

  Now initialize Terraform for staging:

    cd infra/terraform
    terraform init \\
      -backend-config="bucket=${BUCKET}" \\
      -backend-config="prefix=searchlyst/staging"

    terraform workspace new staging  # first time only
    terraform workspace select staging
    terraform apply -var-file=envs/staging.tfvars

═══════════════════════════════════════════════════════════════════════════════
EOF
