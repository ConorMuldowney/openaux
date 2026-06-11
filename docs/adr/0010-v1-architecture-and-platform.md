# ADR 0010: V1 Architecture and Platform Stack

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
The PRD defines a V1 technical direction intended to ship showcases quickly while preserving clear domain boundaries and operational reliability.

## Decision
Adopt the V1 stack and architecture:
- Architecture: Modular monolith
- Language: TypeScript
- Framework: Next.js App Router
- API: Route Handlers with Zod validation
- Database: PostgreSQL on Neon
- Data access: Prisma with targeted SQL where needed
- Auth: Auth0 with verified email for host and voter actions
- Hosting: Vercel
- Object storage: Cloudflare R2
- Jobs/orchestration: Inngest
- Styling/UI: Tailwind CSS plus shadcn/ui with project tokens
- Testing: Vitest, Playwright, Prisma test database
- Observability: Sentry, structured logs, uptime checks
- CI/CD: GitHub Actions with preview deploys and protected production deploys

Additional system decisions:
- Authorization via domain policy engine per action/resource
- Lifecycle via explicit state machine with guarded transitions and transition audit events
- Scoring as live deterministic compute during voting with immutable final snapshot at finalization
- Invite tokens are single-use and bound to accepted identity
- Media strategy: normalize uploads for streaming, keep originals for 30 days, retain normalized versions unless under dispute
- Deferred decision: runtime platform for FFmpeg/transcoding workers

## Consequences
- Speeds initial delivery with one deployable system while preserving modular boundaries.
- Aligns product rules to explicit technical seams for policy, lifecycle, and scoring.
- Leaves worker-runtime selection open and requires a follow-up ADR.

## Sources
- docs/product/prd.md
- docs/setup/linear.md
