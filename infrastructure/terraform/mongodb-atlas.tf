resource "mongodbatlas_project" "poc" {
  name   = var.atlas_project_name
  org_id = var.atlas_organization_id

  lifecycle {
    prevent_destroy = true
    ignore_changes  = [teams]
  }
}

resource "mongodbatlas_advanced_cluster" "poc" {
  project_id   = mongodbatlas_project.poc.id
  name         = var.atlas_cluster_name
  cluster_type = "REPLICASET"

  replication_specs = [
    {
      region_configs = [
        {
          electable_specs = {
            instance_size = "M0"
          }
          provider_name         = "TENANT"
          backing_provider_name = var.atlas_backing_provider_name
          region_name           = var.atlas_region_name
          priority              = 7
        }
      ]
    }
  ]

  lifecycle {
    prevent_destroy = true
  }
}

resource "mongodbatlas_project_ip_access_list" "render" {
  for_each = var.atlas_access_cidrs

  project_id = mongodbatlas_project.poc.id
  cidr_block = each.value
  comment    = "Render outbound - managed by Terraform"

  lifecycle {
    prevent_destroy = true
  }
}
