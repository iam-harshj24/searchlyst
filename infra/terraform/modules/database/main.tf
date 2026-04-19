variable "project_id" { type = string }
variable "region" { type = string }
variable "environment" { type = string }
variable "network_self_link" { type = string }
variable "db_tier" { type = string }
variable "db_version" { type = string }
variable "db_name" { type = string }
variable "db_user" { type = string }
variable "db_disk_size_gb" { type = number }
variable "backup_start_time_utc" { type = string }
variable "retained_backups" { type = number }
variable "retained_tx_log_days" { type = number }
variable "alert_email" { type = string }

locals {
  instance_name = "searchlyst-${var.environment}-db"
}

# ───────── Cloud SQL instance ─────────────────────────────────────────────────
resource "google_sql_database_instance" "this" {
  provider         = google-beta
  project          = var.project_id
  name             = local.instance_name
  region           = var.region
  database_version = var.db_version

  # Set to true once you've validated everything; protects against accidental destroy.
  deletion_protection = false

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"
    disk_size         = var.db_disk_size_gb
    disk_type         = "PD_SSD"
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = var.backup_start_time_utc
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = var.retained_tx_log_days
      backup_retention_settings {
        retained_backups = var.retained_backups
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = var.network_self_link
      enable_private_path_for_google_cloud_services = true
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 20 # 20:00 UTC ≈ 01:30 IST Monday
      update_track = "stable"
    }

    insights_config {
      query_insights_enabled  = true
      record_application_tags = false
      record_client_address   = false
    }
  }
}

# ───────── App database & user ────────────────────────────────────────────────
resource "google_sql_database" "app" {
  project  = var.project_id
  name     = var.db_name
  instance = google_sql_database_instance.this.name
}

resource "random_password" "db" {
  length      = 32
  special     = false # Avoid URL-encoding hassle in DATABASE_URL
  min_lower   = 4
  min_upper   = 4
  min_numeric = 4
}

resource "google_sql_user" "app" {
  project  = var.project_id
  name     = var.db_user
  instance = google_sql_database_instance.this.name
  password = random_password.db.result
}

# ───────── Backup-failure alert ───────────────────────────────────────────────
resource "google_monitoring_notification_channel" "email" {
  project      = var.project_id
  display_name = "searchlyst-${var.environment}-email"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
}

resource "google_monitoring_alert_policy" "backup_failed" {
  project      = var.project_id
  display_name = "Cloud SQL backup failed (searchlyst-${var.environment})"
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL backup operation logged an error"
    condition_matched_log {
      filter = <<-EOT
        resource.type="cloudsql_database"
        resource.labels.database_id="${var.project_id}:${google_sql_database_instance.this.name}"
        protoPayload.methodName:"backup"
        severity>=ERROR
      EOT
    }
  }

  alert_strategy {
    notification_rate_limit {
      period = "3600s"
    }
    auto_close = "604800s"
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
  enabled               = true
}

# ───────── Outputs ────────────────────────────────────────────────────────────
output "connection_name" {
  value = google_sql_database_instance.this.connection_name
}

output "instance_name" {
  value = google_sql_database_instance.this.name
}

output "db_user" {
  value = google_sql_user.app.name
}

output "db_name" {
  value = google_sql_database.app.name
}

output "db_password" {
  value     = random_password.db.result
  sensitive = true
}
