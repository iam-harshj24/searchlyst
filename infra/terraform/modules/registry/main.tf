variable "project_id" { type = string }
variable "region" { type = string }
variable "repo_name" { type = string }
variable "description" { type = string }

resource "google_artifact_registry_repository" "this" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repo_name
  description   = var.description
  format        = "DOCKER"
}

output "repo_name" {
  value = google_artifact_registry_repository.this.repository_id
}

output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.this.repository_id}"
}
