output "vm_ip" {
  description = "VM external static IP. Open http://<this>/ after the first deploy."
  value       = module.compute.vm_external_ip
}

output "vm_name" {
  description = "Compute Engine instance name."
  value       = module.compute.vm_name
}

output "cloudsql_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance), used by cloud-sql-proxy."
  value       = module.database.connection_name
}

output "artifact_registry" {
  description = "Artifact Registry Docker repo URL."
  value       = module.registry.repository_url
}

output "db_user" {
  description = "Application DB user."
  value       = module.database.db_user
}

output "db_name" {
  description = "Application DB name."
  value       = module.database.db_name
}

output "db_password" {
  description = "Generated DB password. Stored in Terraform state — keep state private."
  value       = module.database.db_password
  sensitive   = true
}

output "database_url" {
  description = "Full DATABASE_URL to paste into the GitHub secret."
  value       = "postgresql://${module.database.db_user}:${module.database.db_password}@cloud-sql-proxy:5432/${module.database.db_name}"
  sensitive   = true
}

output "gha_service_account_email" {
  description = "Email of the GitHub Actions deployer SA."
  value       = module.compute.gha_service_account_email
}

output "gha_sa_key_json" {
  description = "JSON key for the GitHub Actions deployer SA. Paste this into the GCP_SA_KEY GitHub secret."
  value       = module.compute.gha_sa_key_json
  sensitive   = true
}

output "github_secrets_summary" {
  description = "Human-readable summary of what to set in GitHub Secrets."
  value       = <<-EOT
    Set these in repo Settings → Secrets and variables → Actions:

      GCP_SA_KEY                          = (run: terraform output -raw gha_sa_key_json)
      GCP_PROJECT_ID                      = ${var.project_id}
      GCP_REGION                          = ${var.region}
      GCP_ZONE                            = ${var.zone}
      GCP_VM_NAME                         = ${module.compute.vm_name}
      GCP_AR_REPO                         = ${module.registry.repo_name}
      CLOUDSQL_INSTANCE_CONNECTION_NAME   = ${module.database.connection_name}
      DATABASE_URL                        = (run: terraform output -raw database_url)
      JWT_SECRET                          = (generate with: openssl rand -hex 32)
      FRONTEND_URL                        = http://${module.compute.vm_external_ip}
      GEMINI_API_KEY                      = (your key, optional)
      INFATICA_API_KEY                    = (your key, optional)
      FIRECRAWL_API_KEY                   = (your key, optional)
      SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / NOTIFICATION_EMAIL = (optional)
      VITE_GOOGLE_CLIENT_ID               = (optional)

    Then visit http://${module.compute.vm_external_ip}/ after the first deploy.
  EOT
}
