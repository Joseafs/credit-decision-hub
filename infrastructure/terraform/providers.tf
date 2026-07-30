provider "mongodbatlas" {}

provider "vercel" {
  team = var.vercel_team_id
}

locals {
  infrastructure_ownership = {
    atlas   = "Terraform após importação controlada"
    render  = "Blueprint render.yaml"
    secrets = "Painéis dos provedores"
    vercel  = "Terraform após importação controlada"
  }
}
