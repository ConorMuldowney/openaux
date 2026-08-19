variable "cloudflare_api_token" {
  description = "Cloudflare API token with 'Workers R2 Storage: Edit' permission on the account."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the R2 buckets."
  type        = string
}
