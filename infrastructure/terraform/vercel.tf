resource "vercel_project" "web" {
  name           = var.vercel_project_name
  framework      = "vite"
  root_directory = "apps/web"
  build_command  = "cd ../.. && pnpm turbo run build --filter=@credit-decision-hub/web..."

  git_repository = {
    type = "github"
    repo = var.github_repository
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "vercel_project_environment_variable" "api_origin" {
  project_id = vercel_project.web.id
  key        = "VITE_API_URL"
  value      = var.api_origin
  target     = var.vercel_environment_targets
  sensitive  = true

  lifecycle {
    prevent_destroy = true
  }
}
