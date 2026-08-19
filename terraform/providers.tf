terraform {
  required_version = ">= 1.7.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # ADR 0011: remote state in Terraform Cloud (free tier).
  cloud {
    organization = "openaux"
    workspaces {
      name = "openaux-r2"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
