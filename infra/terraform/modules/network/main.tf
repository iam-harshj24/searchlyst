variable "project_id" { type = string }
variable "network_name" { type = string }

# Look up the existing default VPC (created automatically with every GCP project).
data "google_compute_network" "this" {
  project = var.project_id
  name    = var.network_name
}

# Reserve an internal IP range that Cloud SQL's private services connection will live in.
resource "google_compute_global_address" "private_services" {
  project       = var.project_id
  name          = "google-managed-services-${var.network_name}"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = data.google_compute_network.this.id
}

# Establish the VPC peering between the project's VPC and Google's services tenant network.
resource "google_service_networking_connection" "this" {
  network                 = data.google_compute_network.this.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_services.name]
}

output "network_self_link" {
  value = data.google_compute_network.this.self_link
}

output "network_id" {
  value = data.google_compute_network.this.id
}
