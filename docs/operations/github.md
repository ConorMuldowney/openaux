# GitHub Platform Standards

- Owner: Platform Engineering
- Last reviewed: 2026-06-12

This document describes branch protection rules and automated CI/CD workflows for the OpenAux repository.

## Branch Protection

The `main` and `develop` branches are protected. All changes must flow through pull requests and satisfy mandatory checks and approval requirements. Protection is enforced at the GitHub API level and cannot be bypassed by force-push or administrative override (except as described in [Bypassing Protection](#bypassing-protection-admin-only)).

### Merge Requirements

To merge a pull request, the following conditions must all be satisfied:

| Requirement | `main` | `develop` |
|---|---|---|
| Approved review (min 1) | ✅ | ✅ |
| `quality` check passes | ✅ | ✅ |
| `pr-validate-linear` check passes | ✅ | ❌ |
| Branch up-to-date | ✅ | ✅ |

- Reviews are dismissed when new commits are pushed — re-approval is required after updates.
- The PR branch must be **up-to-date with the target branch** at merge time.

### Allowed and Blocked Operations

**Allowed:**
- Create and push to feature branches
- Open pull requests against `main` or `develop`
- Force-push on non-protected branches
- Direct pushes to branches other than `main` or `develop`

**Blocked:**
- Direct pushes to `main` or `develop`
- Merge without approval
- Merge with failing required checks
- Merge with stale (dismissed) reviews
- Merge with an outdated branch

---

## CI Workflows

GitHub Actions runs the following workflows automatically.

### Quality: Lint, Type Check, Build

**Trigger:** Every push and pull request to `main` or `develop`.

**Steps:**
1. **Lint** — ESLint, zero warnings tolerated
2. **Type check** — TypeScript strict mode
3. **Build** — Next.js production build

**Status check:** `quality` — required for merge.

Run locally before pushing:
```bash
npm run lint
npm run typecheck
npm run build
```

### PR Title Validation (Linear Reference)

**Workflow:** `.github/workflows/pr-validate-linear.yml`

**Trigger:** PR opened, title edited, or new commits pushed. Applies to PRs targeting `main` only.

**Rule:** PR title must start with `AUX-###: ` format.

**Status check:** `pr-validate-linear` — required for merge to `main`.

Valid formats:
- `AUX-37: Set up CI with preview deploy`
- `AUX-123: Fix showcase lifecycle state machine`

Invalid formats (rejected):
- `Set up CI` — missing Linear reference
- `AUX-37 Set up CI` — missing colon separator
- `Set up AUX-37` — reference must be at start

See [Git Conventions](./git.md) for branch naming and commit message standards.

### Preview Deployment

**Trigger:** Pull requests to `main` or `develop`.

**Current status:** Placeholder — deploys a preview environment per PR and comments the preview URL. Configure deployment provider credentials (e.g., Vercel token) to activate.

### Database Migration Deployment

**Trigger:** Push to `main` or `develop` (not on PRs).

**What it does:**
1. Installs dependencies and generates Prisma Client
2. Applies pending migrations to `development`, `preview`, and `production` environments
3. Fails the workflow if any migration cannot apply cleanly

**Status:** Recommended, not required for merge.

**Secrets required:**
- `DEV_DATABASE_URL`
- `PREVIEW_DATABASE_URL`
- `PROD_DATABASE_URL`

To add a secret: **Settings → Secrets and variables → Actions → New repository secret**. For environment-scoped secrets, go to **Settings → Environments**, select the environment, and add under "Environment secrets".

---

## Troubleshooting

**"Required status check failed"**
- Open the Actions tab, find the failing job, and fix the reported issue (lint error, type error, build error).

**"Merge button is disabled"**
- Ensure you have at least 1 approval and all required checks are green.

**"This branch is out of date"**
- Click "Update branch" on the PR to merge the latest target branch, then wait for checks to re-run.

**"PR title doesn't match required format"**
- Edit the PR title in GitHub to start with `AUX-###: `. The check re-runs automatically.

**"PR not linking to Linear issue"**
- Confirm PR title matches `AUX-###: <description>` (colon + space after issue ID).
- Verify the GitHub–Linear integration is active in Linear settings.

**Quality job fails**
- Run `npm run lint`, `npm run typecheck`, `npm run build` locally and fix reported issues.

**Migration deploy fails**
- Check that the database connection string is correct and the environment is accessible.
- Run `npm run prisma:migrate:status` to inspect the current migration state.

---

## Bypassing Protection (Admin Only)

If absolutely necessary (e.g., a critical security hotfix), a repository admin can merge without waiting for all requirements. This should be rare — document the reason and get team consensus.

---

## References

- [Git Conventions](./git.md)
- [Linear Integration](./linear.md)
- [Database and Migrations](./database.md)
- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
