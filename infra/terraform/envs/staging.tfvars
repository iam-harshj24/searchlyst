#
# Staging environment values.
#
# Fill in project_id and alert_email below, then either:
#   1. Run `terraform apply -var-file=envs/staging.tfvars`, or
#   2. Use the Makefile targets in this directory.
#
# This file IS committed (no secrets here) so the staging config is reproducible.
# Anything sensitive (DB passwords, SA keys) lives in Terraform state, never here.
#

project_id  = "REPLACE_ME_WITH_YOUR_PROJECT_ID"
environment = "staging"
alert_email = "REPLACE_ME@example.com"

region = "asia-south1"
zone   = "asia-south1-a"

vm_machine_type = "e2-small"
vm_disk_size_gb = 20

db_tier         = "db-f1-micro"
db_disk_size_gb = 10

# Add your laptop IP here (e.g. ["1.2.3.4/32"]) if you want direct SSH bypassing IAP.
# Leave empty to require IAP for all SSH (recommended).
ssh_source_ranges = []
