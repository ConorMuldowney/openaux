output "bucket_names" {
  description = "Map of environment key to provisioned R2 bucket name."
  value       = { for key, bucket in cloudflare_r2_bucket.entries : key => bucket.name }
}
