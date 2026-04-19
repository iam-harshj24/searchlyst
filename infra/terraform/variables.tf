variable "project_id" {
  description = "GCP project ID for this environment."
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. staging, prod). Used as a suffix on most resource names."
  type        = string
  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be one of: staging, prod"
  }
}

variable "region" {
  description = "GCP region."
  type        = string
  default     = "asia-south1"
}

variable "zone" {
  description = "GCP zone for the VM."
  type        = string
  default     = "asia-south1-a"
}

variable "alert_email" {
  description = "Email address to receive Cloud SQL backup-failure alerts."
  type        = string
}

# ───────── VM ─────────────────────────────────────────────────────────────────

variable "vm_machine_type" {
  description = "Compute Engine machine type for the app VM."
  type        = string
  default     = "e2-small"
}

variable "vm_disk_size_gb" {
  description = "Boot disk size in GB."
  type        = number
  default     = 20
}

variable "vm_image_family" {
  description = "Source image family for the VM."
  type        = string
  default     = "ubuntu-2204-lts"
}

variable "vm_image_project" {
  description = "Source image project for the VM."
  type        = string
  default     = "ubuntu-os-cloud"
}

# ───────── Cloud SQL ─────────────────────────────────────────────────────────

variable "db_tier" {
  description = "Cloud SQL machine tier (e.g. db-f1-micro, db-g1-small, db-custom-1-3840)."
  type        = string
  default     = "db-f1-micro"
}

variable "db_version" {
  description = "Cloud SQL Postgres version."
  type        = string
  default     = "POSTGRES_16"
}

variable "db_name" {
  description = "Application database name inside the Cloud SQL instance."
  type        = string
  default     = "searchlyst"
}

variable "db_user" {
  description = "Application DB role created on the Cloud SQL instance."
  type        = string
  default     = "searchlyst_app"
}

variable "db_disk_size_gb" {
  description = "Cloud SQL storage size in GB."
  type        = number
  default     = 10
}

variable "db_backup_start_time_utc" {
  description = "Daily backup start time in HH:MM (UTC). Default 18:30 UTC = 00:00 IST."
  type        = string
  default     = "18:30"
}

variable "db_retained_backups" {
  description = "Number of automated daily backups to keep."
  type        = number
  default     = 7
}

variable "db_retained_tx_log_days" {
  description = "Days of transaction logs retained for point-in-time recovery."
  type        = number
  default     = 7
}

# ───────── Firewall ──────────────────────────────────────────────────────────

variable "ssh_source_ranges" {
  description = "Optional CIDRs allowed to SSH directly to the VM (in addition to IAP). Leave empty for IAP-only."
  type        = list(string)
  default     = []
}
