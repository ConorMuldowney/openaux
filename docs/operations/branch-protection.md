# Branch Protection Rules

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

This document describes the recommended branch protection configuration for the `main` branch in the OpenAux repository.

## Purpose

Branch protection rules enforce code quality and review standards by preventing direct pushes and requiring:
- Pull request review and approval
- Passing automated checks (lint, type check, build)
- Linear issue references in metadata
- Up-to-date branches before merge

## Setup Instructions

Branch protection rules are configured in the GitHub web interface, not in code. Only repository administrators can modify these settings.

### Step 1: Navigate to Branch Protection Settings

1. Go to repository home page
2. Click **Settings** (top right)
3. In left sidebar, click **Branches**
4. Under "Branch protection rules," click **Add rule**

### Step 2: Configure Rule for `main` Branch

**Branch name pattern:** `main`

### Step 3: Enable Required Protections

#### ✅ Require a pull request before merging

- **Require approvals:** `1` (minimum 1 approved review)
- **Dismiss stale pull request approvals when new commits are pushed:** `✓` (checked)
- **Require review from Code Owners:** `☐` (unchecked, optional—set if CODEOWNERS file exists)

#### ✅ Require status checks to pass before merging

- **Require branches to be up to date before merging:** `✓` (checked)
- **Status checks that must pass:**
  - `quality` (lint, typecheck, build)
  - `pr-validate-linear` (Linear issue reference in PR title)
  - `prisma-migrate-deploy` (optional—depends on your deployment strategy)

#### ✅ Require code reviews

- **Required:** Yes
- **Dismiss stale PR approvals:** Yes
- **Require CODEOWNERS review:** No (unless you have a CODEOWNERS file)

#### ✅ Require up-to-date branches

- **Require branches to be up to date before merging:** `✓` (checked)
- This ensures PRs are tested against latest main

#### Optional: Additional Protections

- **Require signed commits:** `☐` (unchecked unless your team uses GPG signatures)
- **Include administrators in restrictions:** `☐` (unchecked—allows admins to bypass; check if you want strict enforcement)
- **Require status checks to pass before merging:** `✓` (checked)
- **Require conversation resolution before merging:** `☐` (optional—good for enforcing comment responses)

### Step 4: Save Rule

Click **Create** to save the branch protection rule for `main`.

## Enforcement Details

### What Happens When Protection is Active

✅ **Allowed:**
- Create new branches from `main`
- Push to non-`main` branches
- Open pull requests against `main` (even if title doesn't match)
- Force-push on non-protected branches

❌ **Blocked:**
- Direct push to `main` (even for admins, unless "Include administrators in restrictions" is unchecked)
- Merge PR without 1 approved review
- Merge PR without passing `quality` status check
- Merge PR without passing `pr-validate-linear` check
- Merge PR with stale reviews (if new commits are pushed)
- Merge PR with non-up-to-date branch

### If PR Checks Fail

**Linear issue reference check fails:**
1. Edit PR title to start with `AUX-###: `
2. GitHub will automatically re-run check
3. Once passing, merge is allowed

**Quality check fails:**
1. Pull latest main: `git pull origin main`
2. Create feature branch: `git switch -c feat/AUX-123-fix-issue`
3. Fix the issues (lint, types, build)
4. Commit and push: `git push origin feat/AUX-123-fix-issue`
5. Reopen or update PR—checks run automatically
6. Once all pass, merge is allowed

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
