# CI/GitHub Actions Configuration

This document outlines the continuous integration (CI) workflow and GitHub Actions configuration for OpenAux.

## Workflow Overview

GitHub Actions automatically runs quality checks and deployments based on git events:

- **Pull Requests to `main`**: Run linting, type checking, and build verification
- **Pushes to `main`**: Run quality checks, then deploy migrations to all environments (dev, preview, prod)
- **Manual Trigger**: Can run the entire workflow on demand via GitHub Actions UI

## Jobs

### Quality Job: `Lint Typecheck Build`

**Triggers:** Every PR to `main` and every push to `main`

**Steps:**
1. Checkout code
2. Set up Node.js 20 with npm cache
3. Install dependencies (`npm ci`)
4. Lint code (`npm run lint`)
   - Runs ESLint with zero warnings
   - Validates domain language terminology
5. Type check (`npm run typecheck`)
   - TypeScript strict mode
6. Build (`npm run build`)
   - Next.js build for production

**Status:** Required. PR cannot merge without passing this job.

### Preview Deploy Job: `preview-deploy`

**Triggers:** Pull requests to `main`

**Current Status:** Placeholder job that comments on PR with deployment info.

**Next Steps:** 
- Integrate with hosting provider (Vercel, Netlify, Railway, etc.)
- Configure deployment credentials in GitHub repository secrets
- Update job steps to deploy Next.js app to preview environment
- Auto-comment PR with preview URL

See [Branch Protection Rules](#branch-protection-rules) for required environment setup.

### Prisma Migrate Deploy Job: `Prisma Migrate Deploy`

**Triggers:** Pushes to `main` only (not on PRs)

**Environments:** Development, Preview, Production (runs in each)

**Steps:**
1. Checkout code
2. Set up Node.js 20
3. Install dependencies
4. Generate Prisma Client
5. Apply pending database migrations
6. Validate migration state

**Status:** Optional but recommended. Depends on `quality` job passing.

**Secrets Required:**
- `DEV_DATABASE_URL` — Development database connection string
- `PREVIEW_DATABASE_URL` — Preview database connection string
- `PROD_DATABASE_URL` — Production database connection string

Each secret is configured per GitHub environment with appropriate access controls.

## PR Validation: Linear Issue Reference

**Workflow:** `.github/workflows/pr-validate-linear.yml`

**Triggers:** Pull request open, edit, and synchronize events

**Validation:**
- PR title must start with `AUX-###: ` (Linear issue reference)
- Example: `AUX-37: Set up CI with preview deploy`

**Status:** Required. PR cannot merge without passing this check.

## Running Workflows Locally

### Test Quality Checks

```bash
# Lint
npm run lint

# Typecheck
npm run typecheck

# Build
npm run build
```

### Test Commit Lint

```bash
# Install commitlint locally (done during setup)
# Commits will be validated automatically by Husky pre-commit hook

# Or manually test a commit message:
echo "feat: add new feature" | npx commitlint
```

## Debugging Workflow Failures

### PR Validation Fails
- Check PR title starts with `AUX-###: ` format
- Update PR title in GitHub UI and re-run check

### Quality Job Fails
- **Lint errors:** Run `npm run lint` locally and fix issues
- **Type errors:** Run `npm run typecheck` locally and fix issues
- **Build errors:** Run `npm run build` locally and debug

### Migration Deploy Fails
- Check database connection string is correct and environment is accessible
- Review migration files in `prisma/migrations/`
- Run `npm run prisma:migrate:status` to see current state

### Preview Deploy Placeholder
- Check GitHub repository environment `preview` is configured
- Add deployment provider credentials (Vercel token, etc.)
- Customize workflow job with provider-specific deploy steps

## Adding New Secrets

To add GitHub secrets for deployment:

1. Go to repository **Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Enter secret name (e.g., `VERCEL_TOKEN`)
4. Enter secret value
5. Click **Add secret**

For environment-specific secrets:

1. Go to **Settings > Environments**
2. Select or create the environment (e.g., `preview`)
3. Click **Add secret** under "Environment secrets"
4. Reference in workflow with `${{ secrets.SECRET_NAME }}`

## Continuous Improvement

- **Add tests:** Create `npm run test` script and add test job to workflow
- **Code coverage:** Integrate coverage reporting (Codecov, Coveralls)
- **Deployment notifications:** Add Slack, Discord, or email notifications
- **Performance monitoring:** Track build times and flag regressions
- **Security scanning:** Add SAST/DAST tools (Snyk, Sonarqube)

See [Branch Protection Rules](./branch-protection.md) for GitHub configuration recommendations.
