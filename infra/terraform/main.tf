locals {
  name_suffix = var.environment
  network     = "default"
}

module "apis" {
  source     = "./modules/apis"
  project_id = var.project_id
}

module "network" {
  source       = "./modules/network"
  project_id   = var.project_id
  network_name = local.network

  depends_on = [module.apis]
}

module "registry" {
  source      = "./modules/registry"
  project_id  = var.project_id
  region      = var.region
  repo_name   = "searchlyst"
  description = "Searchlyst container images (${var.environment})"

  depends_on = [module.apis]
}

module "database" {
  source = "./modules/database"

  project_id            = var.project_id
  region                = var.region
  environment           = var.environment
  network_self_link     = module.network.network_self_link
  db_tier               = var.db_tier
  db_version            = var.db_version
  db_name               = var.db_name
  db_user               = var.db_user
  db_disk_size_gb       = var.db_disk_size_gb
  backup_start_time_utc = var.db_backup_start_time_utc
  retained_backups      = var.db_retained_backups
  retained_tx_log_days  = var.db_retained_tx_log_days
  alert_email           = var.alert_email

  depends_on = [module.network]
}

module "compute" {
  source = "./modules/compute"

  project_id            = var.project_id
  region                = var.region
  zone                  = var.zone
  environment           = var.environment
  network               = local.network
  machine_type          = var.vm_machine_type
  disk_size_gb          = var.vm_disk_size_gb
  image_family          = var.vm_image_family
  image_project         = var.vm_image_project
  ssh_source_ranges     = var.ssh_source_ranges
  cloudsql_connection   = module.database.connection_name
  artifact_registry_loc = var.region
  startup_script_path   = "${path.module}/../gcp/vm-startup.sh"

  depends_on = [module.apis, module.registry]
}
