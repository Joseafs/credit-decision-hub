output "infrastructure_ownership" {
  description = "Fonte responsável por cada parte da infraestrutura."
  value       = local.infrastructure_ownership
}

output "vercel_project_id" {
  description = "Identificador do projeto importado da Vercel."
  value       = vercel_project.web.id
}

output "vercel_production_domain" {
  description = "Domínio de produção esperado para o front-end."
  value       = "https://credit-decision-hub-web.vercel.app"
}

output "atlas_project_id" {
  description = "Identificador do projeto importado do Atlas."
  value       = mongodbatlas_project.poc.id
}

output "atlas_cluster_name" {
  description = "Nome do cluster importado do Atlas."
  value       = mongodbatlas_advanced_cluster.poc.name
}
