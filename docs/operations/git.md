# Git Conventions

- Owner: Platform Engineering
- Last reviewed: 2026-06-12

All commits must reference a Linear issue (AUX-###) through branch names and PR titles.

## Branch Naming Convention

Pattern: `<type>/AUX-<number>-<slug>`

**Examples:**
- `feat/AUX-37-ci-preview-deploy-protected-main`
- `fix/AUX-123-policy-transition-race`
- `docs/AUX-42-showcase-lifecycle-docs`
- `refactor/AUX-99-ballot-scoring-logic`

**Type prefixes:**
- `feat/` — New features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `refactor/` — Code refactoring
- `test/` — Test additions
- `chore/` — Maintenance and tooling
- `ci/` — CI/CD configuration

**Enforcement:** Husky pre-commit hooks with commitlint validate branch names locally.

## Pull Request Title Convention

Pattern: `AUX-###: <concise summary>`

**Valid:**
- `AUX-37: Set up CI with preview deploy and protected main gates`
- `AUX-123: Implement ranked ballot tie-break logic`
- `AUX-42: Fix showcase state machine race condition`

**Invalid (rejected by GitHub Actions):**
- `Set up CI` (missing Linear issue reference)
- `AUX-37 Set up CI` (missing colon separator)
- `Set up AUX-37` (reference must be at start)

**Enforcement:** GitHub Actions workflow `pr-validate-linear` validates PR titles. Edit the PR title in GitHub to fix validation failures.

## Commit Messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) style validated by commitlint:

```
<type>(<scope>): <description>

<body>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Format examples:**
- `feat(scoring): implement tie-break logic for ranked ballots`
- `fix(lifecycle): resolve race condition in state transition`
- `docs(readme): add CI/CD workflow documentation`
- `refactor(api): simplify route handler contracts`

**Enforcement:** The `commitlint` tool runs automatically via the `.husky/commit-msg` hook. If a commit message is invalid, commitlint will reject it and provide guidance on the correct format.

## Bypass and Exceptions

In rare cases (e.g., critical hotfix), you may need to commit without validation locally. **Do not use this as a norm.** To commit without validation (for local work only):

```bash
# ONLY for non-pushed commits; not recommended
git commit --no-verify -m "Emergency hotfix: restore service availability"
```

**Never push commits that bypass Linear linking.** All pushed code must be traceable to a Linear issue for accountability and context.
