# CI/GitHub Actions Standards

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

This document describes the continuous integration (CI) systems and automated workflows enforced for OpenAux.

## Overview

GitHub Actions automatically run quality checks, validations, and deployments based on git events. All CI jobs must pass before changes can be merged to `main` or `develop`.

## Automated Workflows

### Quality Checks: Lint, Type Check, Build

**Triggers:**
- Every pull request to `main` or `develop`
- Every push to `main` or `develop`

**What it checks:**
1. **Lint** — ESLint validates all code, enforces zero warnings
2. **Type check** — TypeScript strict mode validation
3. **Build** — Next.js production build verification

**Status:** Required to pass before PR merge
- If any step fails, the PR cannot be merged
- Failures block the `quality` status check

**How to run locally:**
```bash
npm run lint      # Check for linting issues
npm run typecheck # Run TypeScript type checking
npm run build     # Build Next.js app for production
```

### Linear Issue Reference Validation

**Workflow:** `.github/workflows/pr-validate-linear.yml`

**Triggers:**
- PR opened
- PR title edited
- New commits pushed to PR

**Applies to:** PRs targeting `main` only

**Standard:**
- PR title must start with `AUX-###: ` format (Linear issue ID)
- Example: `AUX-37: Implement user authentication`

**Status:** Required to pass before PR merge to `main`
- If the title doesn't match the format, the `pr-validate-linear` check fails
- PR cannot merge until the title is corrected
- Not required for PRs to `develop`

### Preview Deployment

**Triggers:** Pull requests to `main` or `develop`

**Current status:** Placeholder implementation

**Future scope:**
- Deploy preview environment for each PR
- Comment PR with preview URL
- Automatically clean up previews on PR close/merge

**Permissions:**
- Read contents
- Write to issues and pull requests

### Database Migration Deployment

**Triggers:** Pushes to `main` or `develop` (not on PRs)

**Scope:** Runs in development, preview, and production environments

**What it does:**
1. Checks out code
2. Sets up Node.js environment
3. Installs dependencies
4. Generates Prisma Client
5. Applies pending database migrations
6. Validates migration state

**Status:** Recommended but optional
- Does not block PR merge
- Only runs after quality checks pass
- Requires database connection secrets per environment

**Secrets required:**
- `DEV_DATABASE_URL` — Development database (GitHub Secrets)
- `PREVIEW_DATABASE_URL` — Preview environment database (GitHub Secrets)
- `PROD_DATABASE_URL` — Production database (GitHub Secrets)

Each secret is configured per GitHub environment with appropriate access controls.

## Standard Enforcement

### PR Merge Requirements

All of the following must be satisfied:

1. **Quality checks pass** — Lint, type check, build succeed
2. **Linear reference valid** — PR title matches `AUX-###: ` format (required for `main` only)
3. **At least one approval** — See [Branch Protection Standards](branch-protection.md)
4. **Branch is up-to-date** — See [Branch Protection Standards](branch-protection.md)

### Workflow Visibility

- All workflow runs are visible in the **Actions** tab on GitHub
- PR status checks display inline on the PR page
- Detailed logs available for each job and step

## Developer Expectations

- **PRs to `main` must have titles in Linear format** — Check your Linear board for issue IDs (not required for `develop`)
- **Fix quality issues before pushing** — Run lint, typecheck, and build locally to catch issues early
- **Expect automated checks to run on every PR** — Don't wait for manual review, fix CI failures first
- **Don't force-push to PR branches excessively** — Each push triggers checks; rebase carefully

## Integration with Branch Protection

The CI system works in tandem with [branch protection rules](branch-protection.md):

- Branch protection requires `quality` and `pr-validate-linear` checks to pass
- You cannot merge until all required checks are passing and green on GitHub
- Stale reviews expire after new commits are pushed (you may need a re-review)

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
