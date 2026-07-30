variable "vercel_team_id" {
  description = "ID ou slug do time da Vercel. Use null para uma conta pessoal."
  type        = string
  default     = null
  nullable    = true
}

variable "vercel_project_name" {
  description = "Nome do projeto existente na Vercel."
  type        = string
  default     = "credit-decision-hub-web"

  validation {
    condition     = length(trimspace(var.vercel_project_name)) > 0
    error_message = "vercel_project_name não pode ser vazio."
  }
}

variable "github_repository" {
  description = "Repositório GitHub conectado ao projeto da Vercel."
  type        = string
  default     = "Joseafs/credit-decision-hub"

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository deve usar o formato owner/repository."
  }
}

variable "api_origin" {
  description = "Origem pública da API incorporada ao build do front-end."
  type        = string
  default     = "https://credit-decision-api.onrender.com"

  validation {
    condition = can(regex(
      "^https://[a-zA-Z0-9.-]+(?::[0-9]+)?$",
      var.api_origin,
    ))
    error_message = "api_origin deve conter somente uma origem HTTPS, sem caminho."
  }
}

variable "vercel_environment_targets" {
  description = "Ambientes da Vercel que recebem VITE_API_URL."
  type        = set(string)
  default     = ["preview", "production"]

  validation {
    condition = length(var.vercel_environment_targets) > 0 && alltrue([
      for target in var.vercel_environment_targets :
      contains(["development", "preview", "production"], target)
    ])
    error_message = "Use somente development, preview ou production."
  }
}

variable "atlas_organization_id" {
  description = "Identificador da organização existente no MongoDB Atlas."
  type        = string

  validation {
    condition     = can(regex("^[a-f0-9]{24}$", var.atlas_organization_id))
    error_message = "atlas_organization_id deve ser um ObjectId hexadecimal."
  }
}

variable "atlas_project_name" {
  description = "Nome do projeto existente no MongoDB Atlas."
  type        = string
  default     = "Credit Decision Hub"

  validation {
    condition     = length(trimspace(var.atlas_project_name)) > 0
    error_message = "atlas_project_name não pode ser vazio."
  }
}

variable "atlas_cluster_name" {
  description = "Nome do cluster M0 existente no MongoDB Atlas."
  type        = string
  default     = "Cluster0"

  validation {
    condition     = length(trimspace(var.atlas_cluster_name)) > 0
    error_message = "atlas_cluster_name não pode ser vazio."
  }
}

variable "atlas_backing_provider_name" {
  description = "Cloud provider que hospeda o cluster Atlas M0."
  type        = string
  default     = "GCP"

  validation {
    condition = contains(
      ["AWS", "AZURE", "GCP"],
      var.atlas_backing_provider_name,
    )
    error_message = "atlas_backing_provider_name deve ser AWS, AZURE ou GCP."
  }
}

variable "atlas_region_name" {
  description = "Região Atlas do cluster existente, como CENTRAL_US."
  type        = string
  default     = "SOUTH_AMERICA_EAST_1"

  validation {
    condition     = length(trimspace(var.atlas_region_name)) > 0
    error_message = "atlas_region_name não pode ser vazio."
  }
}

variable "atlas_access_cidrs" {
  description = "CIDRs de saída do Render já autorizados no Atlas."
  type        = set(string)
  default = [
    "74.220.48.0/24",
    "74.220.56.0/24",
  ]

  validation {
    condition = alltrue([
      for cidr in var.atlas_access_cidrs : can(cidrnetmask(cidr))
    ])
    error_message = "Cada item de atlas_access_cidrs deve ser um CIDR válido."
  }
}
