# ADR 0011: R2 Provisioning Strategy

- Owner: Platform Engineering
- Last reviewed: 2026-08-19

- Status: Accepted
- Date: 2026-08-19

## Context
ADR 0010 selected Cloudflare R2 as V1 object storage, with a media strategy of normalizing uploads for streaming, keeping originals for 30 days, and retaining normalized versions unless under dispute. R2 itself was not yet provisioned, and the repo has no existing infrastructure-as-code. We need a repeatable way to create and configure separate dev/prod buckets with CORS and lifecycle rules, private by default.

## Decision
Provision R2 with Terraform using the `cloudflare` provider, rather than the Cloudflare dashboard, Wrangler scripts, or a custom API script:
- Declarative config gives a reviewable plan/diff for CORS and lifecycle changes across dev/prod.
- Matches the project's preference for explicit, auditable seams (ADR 0010) over manual dashboard changes.

Provisioning details:
- **Buckets**: `openaux-dev` and `openaux-prod`, each in its own Terraform-managed resource. Both are private (no public bucket access, no custom domain binding).
- **State**: stored remotely in Terraform Cloud (free tier), one workspace per environment.
- **CORS origins**:
  - `http://localhost:3000` (local dev)
  - `https://openaux-*.vercel.app` (preview deployments)
  - `https://app.openaux.net` (production)
- **Lifecycle rules**:
  - Abort incomplete multipart uploads after 1 day.
  - Expire/delete original files after 30 days, matching the ADR 0010 media retention window. Normalized/streaming versions are not subject to this rule.
- **CI/CD**: GitHub Actions applies Terraform changes on merge to `main` (per branch protection conventions in `docs/operations/github.md`), using a Cloudflare API token and account ID stored as repository secrets.

## Consequences
- Adds Terraform as a new toolchain dependency and a Terraform Cloud workspace to manage, in exchange for reviewable, versioned infra changes.
- Requires Cloudflare API token/account ID secrets in both GitHub Actions and Terraform Cloud.
- Future Cloudflare resources (if any) can reuse the same Terraform setup rather than introducing a second provisioning method.

## Sources
- docs/adr/0010-v1-architecture-and-platform.md
- docs/product/prd.md
