# OpenAux Linear Setup

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

This repo does not yet contain application code, so the practical way to connect Linear now is to attach the GitHub repository to a Linear team and establish issue, branch, and pull request conventions before implementation starts.

## Recommended workspace shape

- Workspace: existing product workspace
- Team: `OpenAux`
- Team key: `AUX`
- Project: `OpenAux V1`

## Recommended workflow

- `Backlog`
- `Todo`
- `In Progress`
- `In Review`
- `Done`
- `Canceled`

If you add preview or staging environments later, add `In QA` between `In Review` and `Done`.

## Connect GitHub to Linear

1. In Linear, open `Settings > Features > Integrations > GitHub`.
2. Enable the GitHub integration.
3. Install the Linear GitHub app for the GitHub organization or repository that contains this repo.
4. Grant access to the `openaux` repository.
5. Have each team member connect their personal GitHub account in `Settings > Connected accounts` so PR activity and assignees map correctly.

## Configure issue linking

Use Linear issue IDs in both branches and pull requests.

- Branch name example: `aux-123-showcase-lifecycle`
- PR title example: `AUX-123: implement showcase lifecycle state machine`
- PR description example: `Implements AUX-123`

Linear can link issues from:

- branch names that include the issue ID
- pull request titles that include the issue ID
- pull request titles or descriptions that use a magic word such as `fixes`, `implements`, `refs`, or `related to`

Recommended convention for this repo:

- use the issue ID in the branch name
- use the issue ID at the start of the PR title
- use `Implements AUX-123` or `Refs AUX-123` in the PR description

## Enforcing Linear References

To ensure all code changes are traceable to Linear issues, this repository enforces Linear issue references at multiple points in the workflow.

### Branch Naming Convention

Branches must follow the pattern: `<type>/AUX-<number>-<slug>`

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

Enforcement: Set by Husky pre-commit hooks using commitlint. Branches are created with `git switch -c <branch-name>` to follow this pattern.

### Pull Request Title Enforcement

PR titles must start with `AUX-###: ` followed by a concise summary.

**Valid examples:**
- `AUX-37: Set up CI with preview deploy and protected main gates`
- `AUX-123: Implement ranked ballot tie-break logic`
- `AUX-42: Fix showcase state machine race condition`

**Invalid examples (will be rejected by GitHub Actions):**
- `Set up CI` (missing Linear issue reference)
- `AUX-37 Set up CI` (missing colon separator)
- `Set up AUX-37` (reference must be at start)

**Enforcement:** GitHub Actions workflow `.github/workflows/pr-validate-linear.yml` validates all PR titles. If a PR title is invalid:
1. Edit the PR title in GitHub UI
2. GitHub will automatically re-run the validation
3. Once valid, merging is allowed

### Commit Message Enforcement (Local)

Commit messages are validated locally using Husky + commitlint before they're created.

**Format:** `<type>(<scope>): <description>`

**Examples:**
- `feat(scoring): implement tie-break logic for ranked ballots`
- `fix(lifecycle): resolve race condition in state transition`
- `docs(readme): add CI/CD workflow documentation`
- `refactor(api): simplify route handler contracts`

**Enforcement:** The `commitlint` tool runs automatically via the `.husky/commit-msg` hook. If a commit message is invalid, commitlint will reject it and provide guidance on the correct format.

### Linear Integration

Once GitHub is connected to Linear:

1. Push a branch with format `<type>/AUX-###-<slug>`
2. Open a PR with title `AUX-###: <description>`
3. Linear detects the issue reference and links the PR to the issue
4. PR activity (comments, reviews) appears in Linear
5. PR merge automatically updates the Linear issue status (if configured)

**Setup reminder:**
- Both the creator's GitHub account and the Linear integration must be connected
- See "Connect GitHub to Linear" section above for setup steps

### Bypass and Exceptions

In rare cases (e.g., critical hotfix), you may need to commit without a Linear issue. **Do not use this as a norm.** To commit without validation (for local work only):

```bash
# ONLY for non-pushed commits; not recommended
git commit --no-verify -m "Emergency hotfix: restore service availability"
```

**Never push commits that bypass Linear linking.** All pushed code must be traceable to a Linear issue for accountability and context.

### Troubleshooting

**"commitlint failed"**
- Ensure commit message follows `<type>(<scope>): <description>` format
- Common mistake: missing colon or scope parentheses

**"PR validation failed"**
- Ensure PR title starts with `AUX-###: ` (note the colon and space)
- Edit the PR title in GitHub; validation will re-run automatically

**"Why is this so strict?"**
- Linear issues are the source of truth for all changes
- They document why changes were made, not just what
- This discipline scales the team and improves onboarding
- Future developers can trace code back to original context and acceptance criteria

## Configure status automation

In the Linear team workflow settings, configure pull request automation so that:

- open PR moves issue to `In Progress`
- review requested moves issue to `In Review`
- merged to `main` moves issue to `Done`

If you later add a `staging` branch, configure merges to `staging` to move issues to `In QA` and merges to `main` to move issues to `Done`.

## Optional GitHub issue sync

If you want GitHub Issues and Linear Issues to stay in sync, enable GitHub Issues Sync from the same GitHub integration page.

Recommended default for this repo:

- keep Linear as the primary planning system
- only enable one-way GitHub-to-Linear sync if you expect external bug reports in GitHub
- skip two-way sync unless you want both systems to remain active long term

## Optional GitHub autolink

If you want GitHub to turn `AUX-123` into a clickable Linear link in PRs and comments, add a GitHub autolink reference in the repository settings.

Use this pattern:

- key prefix: `AUX`
- target URL: `https://linear.app/<workspace>/issue/AUX-<num>`

Replace `<workspace>` with your actual Linear workspace slug.

## Vercel previews

The current product direction calls for Vercel hosting. Once the app exists and the GitHub integration is connected, Linear can surface preview links from linked pull requests automatically when preview links are present.

## Suggested initial project structure

Create the `OpenAux V1` project in Linear and seed it with the following parent issues:

1. `AUX-1` Showcase lifecycle and state machine
2. `AUX-2` Access control, identities, and invites
3. `AUX-3` Entry submission and required sample validation
4. `AUX-4` Ranked ballots, scoring, and tie-breaking
5. `AUX-5` Blind judging and post-results reveal
6. `AUX-6` Host controls for cancel and deadline extension
7. `AUX-7` Platform foundations: Next.js, Auth0, Prisma, Neon, R2, Inngest
8. `AUX-8` Test harness: Vitest, Playwright, test database, CI

## Suggested first implementation issues

Start with a narrow set of tracer-bullet issues under the project:

1. Create Next.js app shell with Tailwind, shadcn, and route handler support.
2. Add Auth0 login flow and verified-email enforcement middleware.
3. Model `Showcase`, `Invite`, `Participant`, `Entry`, and `Ballot` in Prisma.
4. Implement the showcase state machine with guarded transitions.
5. Add policy checks for hosting, invite acceptance, submission, listening, and voting.
6. Build a host flow for creating a showcase with participation, listener, voter, and blind-judging scopes.

## Definition of done for Linear-connected work

- Every branch references one Linear issue.
- Every PR references one or more Linear issues.
- Merge automation transitions the linked issue without manual cleanup.
- Project work is grouped under `OpenAux V1` rather than tracked as unrelated standalone issues.