variable "project_id" { type = string }
variable "region" { type = string }
variable "zone" { type = string }
variable "environment" { type = string }
variable "network" { type = string }
variable "machine_type" { type = string }
variable "disk_size_gb" { type = number }
variable "image_family" { type = string }
variable "image_project" { type = string }
variable "ssh_source_ranges" { type = list(string) }
variable "cloudsql_connection" { type = string }
variable "artifact_registry_loc" { type = string }
variable "startup_script_path" { type = string }

locals {
  vm_name        = "searchlyst-${var.environment}-vm"
  static_ip_name = "searchlyst-${var.environment}-ip"
  vm_sa_name     = "vm-runtime-${var.environment}"
  gha_sa_name    = "gha-deployer-${var.environment}"
  http_fw_name   = "searchlyst-${var.environment}-allow-http"
  iap_fw_name    = "searchlyst-${var.environment}-allow-ssh-iap"
  myip_fw_name   = "searchlyst-${var.environment}-allow-ssh-extra"
  http_tag       = "http-server"
  https_tag      = "https-server"
}

# ───────── Service accounts ───────────────────────────────────────────────────
resource "google_service_account" "vm" {
  project      = var.project_id
  account_id   = local.vm_sa_name
  display_name = "Searchlyst ${var.environment} VM runtime"
}

resource "google_service_account" "gha" {
  project      = var.project_id
  account_id   = local.gha_sa_name
  display_name = "Searchlyst ${var.environment} GitHub Actions deployer"
}

# IAM bindings for VM runtime SA
resource "google_project_iam_member" "vm_roles" {
  for_each = toset([
    "roles/cloudsql.client",
    "roles/artifactregistry.reader",
    "roles/logging.logWriter",
    "roles/monitoring.metricWriter",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.vm.email}"
}

# IAM bindings for GHA deployer SA
resource "google_project_iam_member" "gha_roles" {
  for_each = toset([
    "roles/artifactregistry.writer",
    "roles/compute.osAdminLogin",
    "roles/iap.tunnelResourceAccessor",
    "roles/compute.viewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.gha.email}"
}

# GHA needs to act as the VM SA for some operations (e.g. setting metadata).
resource "google_service_account_iam_member" "gha_can_use_vm_sa" {
  service_account_id = google_service_account.vm.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.gha.email}"
}

# JSON key for GitHub Actions (stored in TF state, marked sensitive in outputs).
resource "google_service_account_key" "gha" {
  service_account_id = google_service_account.gha.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# ───────── Static external IP ─────────────────────────────────────────────────
resource "google_compute_address" "this" {
  project = var.project_id
  region  = var.region
  name    = local.static_ip_name
}

# ───────── Firewall rules ─────────────────────────────────────────────────────
resource "google_compute_firewall" "http" {
  project   = var.project_id
  name      = local.http_fw_name
  network   = var.network
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = [local.http_tag, local.https_tag]
}

# Always allow Identity-Aware Proxy SSH (used by `gcloud compute ssh --tunnel-through-iap`)
resource "google_compute_firewall" "ssh_iap" {
  project   = var.project_id
  name      = local.iap_fw_name
  network   = var.network
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = ["35.235.240.0/20"]
}

# Optional extra SSH source CIDRs (set ssh_source_ranges = []  for IAP-only).
resource "google_compute_firewall" "ssh_extra" {
  count = length(var.ssh_source_ranges) > 0 ? 1 : 0

  project   = var.project_id
  name      = local.myip_fw_name
  network   = var.network
  direction = "INGRESS"

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }

  source_ranges = var.ssh_source_ranges
}

# ───────── VM ─────────────────────────────────────────────────────────────────
resource "google_compute_instance" "this" {
  project      = var.project_id
  zone         = var.zone
  name         = local.vm_name
  machine_type = var.machine_type
  tags         = [local.http_tag, local.https_tag]

  boot_disk {
    initialize_params {
      image = "${var.image_project}/${var.image_family}"
      size  = var.disk_size_gb
      type  = "pd-balanced"
    }
  }

  network_interface {
    network = var.network
    access_config {
      nat_ip = google_compute_address.this.address
    }
  }

  service_account {
    email  = google_service_account.vm.email
    scopes = ["cloud-platform"]
  }

  metadata = {
    enable-oslogin                    = "TRUE"
    cloudsql-instance-connection-name = var.cloudsql_connection
    artifact-registry-location        = var.artifact_registry_loc
  }

  metadata_startup_script = file(var.startup_script_path)

  # Re-running the startup script on metadata change is fine; we don't want to
  # recreate the VM just because we changed a comment in the startup script.
  lifecycle {
    ignore_changes = [
      metadata_startup_script,
    ]
  }
}

# ───────── Outputs ────────────────────────────────────────────────────────────
output "vm_name" { value = google_compute_instance.this.name }
output "vm_external_ip" { value = google_compute_address.this.address }
output "vm_service_account_email" { value = google_service_account.vm.email }
output "gha_service_account_email" { value = google_service_account.gha.email }

output "gha_sa_key_json" {
  value     = base64decode(google_service_account_key.gha.private_key)
  sensitive = true
}
