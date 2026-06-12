# Database and Migrations

- Owner: Platform Engineering
- Last reviewed: 2026-06-12

OpenAux uses PostgreSQL (Neon) with Prisma ORM for schema management and migrations.

## Database Environments

Three Neon databases correspond to deployment stages:

| Environment | Connection String Secret | Purpose |
|---|---|---|
| `development` | `DEV_DATABASE_URL` | Local development with `npm run dev` |
| `preview` | `PREVIEW_DATABASE_URL` | Preview deployments on PR |
| `production` | `PROD_DATABASE_URL` | Live environment |

Connection string format:
```
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

## Local Development

Set `.env.local`:
```dotenv
DATABASE_URL="postgresql://..."
```

Common commands:
```bash
npm run prisma:generate      # Generate Prisma client
npm run prisma:migrate:dev   # Create migration and apply to dev database
npm run prisma:migrate:status # Check migration status
npm run db:seed              # Run seed script (prisma/seed.ts)
```

## Creating Migrations

Create new migrations in development only:

```bash
npm run prisma:migrate:dev -- --name <migration_name>
```

This generates a migration file in `prisma/migrations/` and applies it immediately. Commit these files to git.

## CI/CD Deployment

On `push` to `main`, GitHub Actions automatically:

1. Deploys committed migrations to all three environments
2. Verifies each environment's migration history is consistent
3. Fails the workflow if migrations can't apply cleanly

No manual deployment steps required; migrations apply automatically via the CI workflow.

## Schema Reference

Schema is defined in [prisma/schema.prisma](../../prisma/schema.prisma). After editing:

```bash
npm run prisma:format        # Format schema file
npm run prisma:generate      # Regenerate Prisma client
```
