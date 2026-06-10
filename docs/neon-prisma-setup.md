# Neon and Prisma Migration Setup

This guide provisions Neon databases for each deployment environment and wires Prisma migration deploy checks into GitHub Actions.

## 1. Provision Neon environments

Create three Neon databases or branches from the Neon console:

1. `openaux-dev` for development
2. `openaux-preview` for preview deployments
3. `openaux-prod` for production

For each environment, copy the pooled connection string and append `?sslmode=require` if Neon does not include it automatically.

Example format:

```text
postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

## 2. Configure local and hosted secrets

### Local development

Set `.env.local`:

```dotenv
DATABASE_URL="postgresql://<dev-connection-string>"
```

### GitHub Actions environment secrets

Create GitHub environments and add matching secrets:

1. Environment `development` with secret `DEV_DATABASE_URL`
2. Environment `preview` with secret `PREVIEW_DATABASE_URL`
3. Environment `production` with secret `PROD_DATABASE_URL`

The CI workflow at `.github/workflows/ci.yml` deploys migrations against each environment on `push` to `main` and on manual dispatch.

### Vercel runtime environment variables

Set `DATABASE_URL` in Vercel for:

1. Development environment
2. Preview environment
3. Production environment

## 3. Generate and commit migrations

Create new migrations in development only:

```bash
npm run prisma:migrate:dev -- --name <migration_name>
```

Then commit the generated files in `prisma/migrations`.

## 4. CI migration verification

The migration job runs:

1. `npm run prisma:migrate:deploy`
2. `npm run prisma:migrate:status`

This verifies committed migrations apply cleanly and the migration history is consistent in development, preview, and production Neon databases.

## 5. Manual verification checklist

Run this once after secrets are set:

1. Trigger `CI` workflow manually from GitHub Actions.
2. Confirm all three matrix jobs in `Prisma Migrate Deploy` pass.
3. Confirm `_prisma_migrations` is populated in each Neon environment.
