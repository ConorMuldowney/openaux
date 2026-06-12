# Branch Protection Standards

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

This document describes the branch protection standards enforced on the `main` and `develop` branches in the OpenAux repository.

## Overview

The `main` and `develop` branches are protected to enforce code quality, review standards, and maintainability. All changes to these branches must flow through pull requests and satisfy mandatory checks and approval requirements.

## Merge Requirements

To merge a pull request to `main`, the following conditions must all be satisfied:

### 1. Code Review Approval

- Minimum **1 approved review** from another contributor required
- Reviews become stale if new commits are pushed—new approval is required after updates
- Approval must be from a reviewer other than the PR author
- Applies to PRs targeting both `main` and `develop`

### 2. Status Checks

All of the following checks must pass:

- **`quality`** — Linting, type checking, and build verification
- **`pr-validate-linear`** — PR title must start with `AUX-###: ` (Linear issue reference) (required for `main` only)

Optional but recommended:

- **`prisma-migrate-deploy`** — Database migrations must be deployable (when applicable)

### 3. Branch Currency

- The PR branch must be **up-to-date with `main`** at merge time
- Stale branches must be updated before merging
- GitHub enforces this at the time of merge

## Allowed and Blocked Operations

### ✅ Allowed

- Create and push to feature branches
- Open pull requests against `main` (checks run automatically)
- Force-push on non-protected branches
- Direct pushes to branches other than `main`

### ❌ Blocked

- **Direct pushes to `main` or `develop`** — All changes must go through reviewed PRs
- **Merge without approval** — At least one review approval required
- **Merge with failing checks** — Quality checks must pass (Linear check required for `main` only)
- **Merge with stale reviews** — Reviews expire if new commits are pushed
- **Merge with outdated branch** — Branch must be rebased or merged with latest `main` or `develop`

## Response to Check Failures

### Linear Issue Reference Check Fails (for PRs to `main`)

The PR title doesn't match the required `AUX-###: ` format.

**How to fix:**
1. Edit the PR title to start with `AUX-###: ` (e.g., `AUX-37: Implement feature`)
2. GitHub automatically re-runs the check
3. Once passing, the PR is eligible for merge

**Note:** This check is required only for PRs targeting `main`. PRs to `develop` do not require Linear references.

### Quality Check Fails

Lint, type check, or build verification failed.

**How to fix:**
1. Pull the latest from `main`
2. Fix the identified issues (lint warnings, TypeScript errors, build errors)
3. Commit and push the fixes to your feature branch
4. The check runs automatically on push
5. Once passing, the PR is eligible for merge (assuming other requirements are met)

## Protection Scope

Branch protection applies to:

- **Protected branches:** `main` and `develop`
- **Applied to:** All contributors, including repository administrators
- **Not applied to:** Feature branches, release branches, or other branches

The protection is enforced at the GitHub API level and cannot be bypassed by force-pushes or administrative override.

### Linear Issue Linking

The `pr-validate-linear.yml` workflow enforces that PR titles include Linear issue references.

**Valid PR title formats:**
- `AUX-37: Set up CI with preview deploy`
- `AUX-123: Fix showcase lifecycle state machine`
- `AUX-42: Refactor ballot scoring logic`

**Invalid PR title formats (will be rejected):**
- `Set up CI with preview deploy` (missing AUX-###)
- `AUX-37 Set up CI` (missing colon separator)
- `Set up AUX-37` (issue ref must be at start)

When Linear GitHub integration is enabled, the issue reference in the PR title automatically links the GitHub PR to the Linear issue, creating a bidirectional connection.

## Discipline: Why These Rules Matter

1. **Approval requirement:** Ensures at least one other developer reviews changes before merge
2. **Status checks:** Guarantees code quality (no lint errors, types pass, builds work)
3. **Linear issue reference:** Tracks all code changes back to their origin issues; essential for understanding motivation and scope
4. **Up-to-date branches:** Prevents merge conflicts and ensures tests pass against latest code
5. **Stale approval dismissal:** Forces re-review when commits change; reviewers can't approve old code then watch modified code merge

## Bypassing Protection (Admin Only)

If absolutely necessary (e.g., critical security hotfix), a repository admin can:

1. Go to the PR
2. Click **Merge without waiting for requirements to pass** (if branch protection allows it)
3. This should be rare; document the reason

⚠️ **Warning:** Bypassing protections defeats the purpose. Use sparingly and only with team consensus.

## Testing Branch Protection

To verify branch protection is working:

1. Create a test PR against `main`
2. Attempt to merge **without approval** → Should be blocked
3. Attempt to merge **without passing quality checks** → Should be blocked
4. Get 1 approval and ensure all checks pass → Should be allowed to merge

## Troubleshooting

**Problem:** "Required status check failed"
- Solution: Check GitHub Actions logs for the failing job. Fix and re-push.

**Problem:** "Merge button is disabled"
- Solution: Ensure you have 1 approval and all required checks are passing (green checkmarks).

**Problem:** "This branch is out of date"
- Solution: Click "Update branch" to merge latest main into your PR branch, then wait for checks to re-run.

**Problem:** "PR title doesn't match required format"
- Solution: Edit PR title to start with `AUX-###: ` pattern. Check will re-run automatically.

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [CI/GitHub Actions Workflows](./ci-github-actions.md)
- [Linear Setup and Conventions](../setup/linear.md)
