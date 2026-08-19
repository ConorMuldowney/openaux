# ADR 0011: R2 Provisioning Strategy
# Buckets are private (no public access, no custom domain). Originals live under the
# "originals/" prefix so the 30-day expiry rule never touches normalized/streaming copies.

locals {
  environments = {
    dev  = "openaux-dev"
    prod = "openaux-prod"
  }

  cors_origins = [
    "http://localhost:3000",
    "https://openaux-*.vercel.app",
    "https://app.openaux.net",
    "https://www.openaux.net",
  ]
}

resource "cloudflare_r2_bucket" "entries" {
  for_each = local.environments

  account_id = var.cloudflare_account_id
  name       = each.value
  location   = "wnam"
}

resource "cloudflare_r2_bucket_cors" "entries" {
  for_each = local.environments

  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.entries[each.key].name

  rules = [{
    id = "openaux-app-origins"
    allowed = {
      methods = ["GET", "PUT", "POST"]
      origins = local.cors_origins
      headers = ["*"]
    }
    max_age_seconds = 3600
  }]
}

resource "cloudflare_r2_bucket_lifecycle" "entries" {
  for_each = local.environments

  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.entries[each.key].name

  rules = [
    {
      id      = "abort-incomplete-multipart-uploads"
      enabled = true
      conditions = {
        prefix = ""
      }
      abort_multipart_uploads_transition = {
        condition = {
          type    = "Age"
          max_age = 86400 # 1 day
        }
      }
    },
    {
      id      = "expire-originals-after-30-days"
      enabled = true
      conditions = {
        prefix = "originals/"
      }
      delete_objects_transition = {
        condition = {
          type    = "Age"
          max_age = 2592000 # 30 days
        }
      }
    },
  ]
}
