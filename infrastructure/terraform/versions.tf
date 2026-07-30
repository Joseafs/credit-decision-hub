terraform {
  required_version = "~> 1.15.0"

  required_providers {
    mongodbatlas = {
      source  = "mongodb/mongodbatlas"
      version = "2.14.0"
    }

    vercel = {
      source  = "vercel/vercel"
      version = "5.4.1"
    }
  }
}
