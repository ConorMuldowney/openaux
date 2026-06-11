# Ticket-to-PR Workflow Automation

## Overview

This document describes the **automated end-to-end workflow** for taking a Linear or GitHub issue from creation through implementation, testing, commit organization, and pull request creation. The workflow is triggered by a single Copilot Chat prompt and handles the entire pipeline:

```bash
/start-ticket <linear-or-github-url>
```

The prompt is defined in the VS Code user prompts folder as `start-ticket.md` and chains the existing ticket, commit, and PR skills.

This command:
1. **Parses** the issue URL to extract number, title, and type
2. **Creates** a Git worktree with a semantically meaningful name
3. **Implements** the solution using AI-assisted code generation
4. **Chunks** changes into logical, conventional commits
5. **Pushes** the branch and **creates a PR** with the correct Linear reference format

## Goals

- **Eliminate friction** in the development workflow by automating repetitive setup tasks
- **Enforce consistency** in branch naming, commit messages, and PR titles across all tickets
- **Enable parallel work** by using Git worktrees for isolated, independent ticket branches
- **Leverage domain knowledge** by grounding AI implementation in CONTEXT.md, ADRs, and existing codebase patterns
- **Reduce manual errors** in PR formatting and Linear issue references

## Architecture

### Worktree-Based Isolation

Instead of switching branches in a single directory, each ticket gets its own **Git worktree**:

```
.worktrees/
├── AUX-37/                    # Feature worktree for ticket AUX-37
│   ├── .git (shared with main)
│   └── [full project tree]    # Isolated copy of project at feature branch
├── AUX-123/                   # Bug fix worktree for ticket AUX-123
└── AUX-42/                    # Docs worktree for ticket AUX-42
```

**Benefits:**
- Multiple tickets can be worked on in parallel without branch switching
- Each worktree is a clean, isolated directory tree
- No risk of accidentally committing unrelated changes
- Worktrees can be deleted after PR merge, or kept for reference

### Skill-Based Pipeline

The workflow delegates to three existing, battle-tested skills:

| Skill | Responsibility | Input | Output |
|-------|---|---|---|
| **tackle-ticket-with-docs** | Parse issue, read domain docs (CONTEXT.md, ADRs), implement solution | Issue URL, worktree path | Working code with tests |
| **chunk-and-commit** | Organize changes into logical commits with conventional messages | Unstaged changes | Committed code with proper commit history |
| **push-and-create-pr** | Push branch and create PR with enforced Linear reference format | Branch name, base branch, PR title | Remote branch + open PR |

### Base Branch: `develop`

All feature branches are created from and PR'd against `develop`:

```
develop (base)
├── feat/AUX-37-ci-preview-deploy
├── fix/AUX-123-policy-transition-race
└── docs/AUX-42-showcase-lifecycle-docs
```

The `develop` branch is the integration point; `main` remains for stable releases.

## Workflow Steps

### Phase 1: Trigger & Parse

**Command:**
```bash
/start-ticket https://linear.app/openaux/issue/AUX-37/set-up-ci-preview-deploy
# or
/start-ticket https://github.com/owner/repo/issues/123
```

**Script:** `scripts/start-ticket.mjs`

**Parsing logic:**
- Detects Linear URL pattern: `https://linear.app/openaux/issue/AUX-###/...`
- Detects GitHub URL pattern: `https://github.com/owner/repo/issues/###`
- Extracts issue number and fetches title from Linear API or GitHub API
- Determines issue type (feat/fix/docs/refactor/test/chore/ci) from:
  - Issue labels (if present)
  - Default: `feat/` for feature requests, `fix/` for bugs
- Generates slug: kebab-case, max 40 chars, from issue title

**Output:**
```json
{
  "number": 37,
  "title": "Set up CI with preview deploy and protected main gates",
  "slug": "ci-preview-deploy-protected-main",
  "type": "feat",
  "issueUrl": "https://linear.app/openaux/issue/AUX-37/...",
  "branchName": "feat/AUX-37-ci-preview-deploy-protected-main"
}
```

### Phase 2: Worktree & Branch Creation

**Script:** `scripts/create-worktree.mjs`

**Logic:**
1. Validate branch name format: `^(feat|fix|docs|refactor|test|chore|ci)/AUX-[0-9]+-[a-z0-9-]+$`
2. Fetch current `develop` branch to ensure it's up-to-date
3. Create worktree at `.worktrees/AUX-<number>/`
4. Create new branch from `develop` with the semantic name
5. Change directory into the worktree

**Output:**
```
✓ Worktree created at .worktrees/AUX-37/
✓ Branch created: feat/AUX-37-ci-preview-deploy-protected-main
✓ Changed to worktree directory
```

### Phase 3: Implementation

**Skill:** `tackle-ticket-with-docs`

**Logic:**
1. Read issue title, description, and acceptance criteria from Linear/GitHub
2. Load project domain language from [CONTEXT.md](../CONTEXT.md)
3. Load architectural decisions from [docs/adr/](../adr/)
4. Analyze codebase to understand existing patterns and conventions
5. Generate implementation code following the repo's style and patterns
6. Run tests to validate implementation
7. Report implementation summary and any manual intervention needed

**Output:**
- Modified and new files in the worktree
- Tests passing locally (`npm run test:unit`, `npm run test:integration`)
- Implementation aligned with domain language and ADRs

### Phase 4: Commit Chunking

**Skill:** `chunk-and-commit`

**Logic:**
1. Review all unstaged changes in the worktree
2. Group related changes logically (e.g., all scoring logic together, all tests together)
3. Generate conventional commit messages: `<type>(<scope>): <description>`
   - Examples: `feat(scoring): implement tie-break logic for ranked ballots`
   - Examples: `test(scoring): add tests for edge cases in tie-break logic`
4. Create commits with proper messages
5. Validate against commitlint rules

**Output:**
```
✓ Commits created:
  - feat(scoring): implement tie-break logic for ranked ballots
  - test(scoring): add tests for edge cases in tie-break logic
  - docs(scoring): document tie-break algorithm in ADR
```

### Phase 5: Push & PR Creation

**Skill:** `push-and-create-pr`

**Logic:**
1. Push branch to remote
2. Create pull request targeting `develop`
3. Enforce PR title format: `AUX-###: <title>`
   - Validated by GitHub Actions workflow: [.github/workflows/pr-validate-linear.yml](.github/workflows/pr-validate-linear.yml)
4. Auto-populate PR description with issue link
5. Return PR URL

**Output:**
```
✓ Branch pushed: feat/AUX-37-ci-preview-deploy-protected-main
✓ PR created: AUX-37: Set up CI with preview deploy and protected main gates
✓ View PR: https://github.com/owner/repo/pull/###
```

### Phase 6: Cleanup (Optional)

After the PR is merged, the worktree can be deleted:

```bash
rm -rf .worktrees/AUX-37/
git worktree prune
```

Or kept for reference and testing.

## Branch Naming Conventions

All branches follow the format specified in [docs/setup/linear.md](./linear.md#L58):

```
<type>/AUX-<number>-<slug>
```

**Type prefixes:**
- `feat/` — new feature
- `fix/` — bug fix
- `docs/` — documentation update
- `refactor/` — code refactoring
- `test/` — test additions/improvements
- `chore/` — build, dependencies, tooling
- `ci/` — CI/CD pipeline changes

**Examples:**
- `feat/AUX-37-ci-preview-deploy-protected-main`
- `fix/AUX-123-policy-transition-race`
- `docs/AUX-42-showcase-lifecycle-docs`
- `refactor/AUX-99-ballot-scoring-logic`

## Commit Message Conventions

All commits follow the conventional commit format:

```
<type>(<scope>): <description>
```

**Examples:**
- `feat(scoring): implement tie-break logic for ranked ballots`
- `fix(lifecycle): resolve race condition in state transition`
- `docs(readme): add CI/CD workflow documentation`
- `refactor(api): simplify route handler contracts`
- `test(ballots): add edge case tests for ranked voting`

**Scope:** The module or feature being changed (e.g., `scoring`, `lifecycle`, `api`, `ballots`)

**Description:** Present tense, lowercase, no period

### Validation

Commits are validated locally by Husky + commitlint:
- **File:** `.husky/commit-msg`
- **Config:** `@commitlint/config-conventional`

To bypass validation (emergency only):
```bash
git commit --no-verify
```

## PR Title & Description Format

Pull requests must follow the Linear issue reference format:

**Title pattern:** `AUX-###: <title>`

**Valid examples:**
- `AUX-37: Set up CI with preview deploy and protected main gates`
- `AUX-123: Implement ranked ballot tie-break logic`
- `AUX-42: Fix showcase state machine race condition`

**Invalid examples (rejected by GitHub Actions):**
- ❌ `Set up CI` (missing reference)
- ❌ `AUX-37 Set up CI` (missing colon and space)
- ❌ `Set up AUX-37` (reference must be at start)

**Validation:** GitHub Actions workflow [`pr-validate-linear.yml`](.github/workflows/pr-validate-linear.yml) validates all PRs before they can be merged.

**Description template:** Include a link to the Linear issue:

```markdown
# Description
Brief description of what this PR does.

# Implementation Notes
Any key decisions, trade-offs, or technical notes.

# Testing
- [ ] Unit tests added
- [ ] Integration tests passed
- [ ] Manual testing completed

Implements AUX-###
```

## Setup & Installation

### Prerequisites

- **Node.js** 18+ (for scripts)
- **Git** 2.13+ (for worktree support)
- **Linear API key** (optional, for fetching issue titles; fall back to manual input if not set)
  - Add to `.env.local`: `LINEAR_API_KEY=lin_...`
- **GitHub token** (optional, for GitHub issues; public issues work without auth)
  - Add to `.env.local`: `GITHUB_TOKEN=ghp_...`

### Add npm Scripts

Update `package.json`:

```json
{
  "scripts": {
    "start-ticket": "node scripts/start-ticket.mjs",
    "create-worktree": "node scripts/create-worktree.mjs"
  }
}
```

### Create Shell Alias

Add to your shell configuration (`.bashrc`, `.zshrc`, etc.):

```bash
alias /start-ticket='npm run start-ticket --'
```

Or for Windows PowerShell, add to your profile:

```powershell
function start-ticket {
  npm run start-ticket -- $args
}
```

### Verify Setup

```bash
/start-ticket --help
```

Should output usage instructions and example commands.

## Usage Examples

### Example 1: Implement a Feature from Linear

```bash
$ /start-ticket https://linear.app/openaux/issue/AUX-37/set-up-ci-preview-deploy

✓ Parsed issue: AUX-37 - Set up CI with preview deploy and protected main gates
✓ Worktree created at .worktrees/AUX-37/
✓ Branch created: feat/AUX-37-ci-preview-deploy-protected-main
✓ Implementation in progress...
  - Reading CONTEXT.md
  - Reading ADRs
  - Generating implementation
  - Running tests
✓ Implementation complete
✓ Commits created:
  - feat(ci): add GitHub Actions workflow for preview deploy
  - test(ci): add tests for preview deploy workflow
  - docs(ci): document CI/CD pipeline in README
✓ Branch pushed
✓ PR created: AUX-37: Set up CI with preview deploy and protected main gates
✓ View PR: https://github.com/owner/repo/pull/###
```

### Example 2: Fix a Bug with Type Override

```bash
$ /start-ticket https://github.com/owner/repo/issues/123 --type=fix

✓ Parsed issue: AUX-123 - Policy transition race condition
✓ Worktree created at .worktrees/AUX-123/
✓ Branch created: fix/AUX-123-policy-transition-race
✓ Implementation in progress...
  - Analyzing race condition
  - Implementing fix
  - Running tests
✓ Implementation complete
✓ Commits created:
  - fix(policy): resolve race condition in state transition
  - test(policy): add regression test for race condition
✓ Branch pushed
✓ PR created: AUX-123: Fix policy transition race condition
✓ View PR: https://github.com/owner/repo/pull/###
```

### Example 3: Documentation Update

```bash
$ /start-ticket https://linear.app/openaux/issue/AUX-42/showcase-lifecycle-docs --type=docs

✓ Parsed issue: AUX-42 - Showcase lifecycle state machine documentation
✓ Worktree created at .worktrees/AUX-42/
✓ Branch created: docs/AUX-42-showcase-lifecycle-docs
✓ Implementation in progress...
  - Reading lifecycle module
  - Generating documentation
✓ Implementation complete
✓ Commits created:
  - docs(lifecycle): add state machine documentation with diagrams
✓ Branch pushed
✓ PR created: AUX-42: Showcase lifecycle state machine documentation
✓ View PR: https://github.com/owner/repo/pull/###
```

## Script Details

### `scripts/start-ticket.mjs`

**Entry point** for the entire workflow.

**Responsibilities:**
1. Parse command-line arguments (issue URL, optional flags like `--type`)
2. Validate issue URL format (Linear or GitHub)
3. Fetch issue metadata (number, title) from Linear API or GitHub API
4. Determine issue type (feat/fix/docs/etc.) from labels or flag
5. Call `create-worktree.mjs` with parsed data
6. Invoke `tackle-ticket-with-docs` skill in the new worktree
7. Invoke `chunk-and-commit` skill to organize changes
8. Invoke `push-and-create-pr` skill to push and create PR
9. Report workflow completion and PR URL

**Example invocation:**
```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-37/...
npm run start-ticket -- https://github.com/owner/repo/issues/123 --type=fix
```

### `scripts/create-worktree.mjs`

**Creates Git worktree and branch** for the ticket.

**Responsibilities:**
1. Validate branch name format
2. Check if worktree already exists (prevent duplicates)
3. Fetch `develop` branch to ensure it's up-to-date
4. Create worktree directory structure: `.worktrees/AUX-<number>/`
5. Create new branch from `develop` with semantic name
6. Change directory to worktree
7. Return worktree path and branch name

**Example invocation:**
```bash
npm run create-worktree -- --number 37 --type feat --slug ci-preview-deploy-protected-main
```

## Environment Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `LINEAR_API_KEY` | Fetch issue titles from Linear | `lin_...` | No (fall back to manual input) |
| `GITHUB_TOKEN` | Fetch GitHub issue data (for auth) | `ghp_...` | No (works without for public repos) |
| `WORKTREE_BASE_PATH` | Base path for worktrees | `.worktrees/` | No (defaults to `.worktrees/`) |

**Add to `.env.local`** in the project root:
```env
LINEAR_API_KEY=lin_...
GITHUB_TOKEN=ghp_...
WORKTREE_BASE_PATH=.worktrees/
```

> `.env.local` is already git-ignored by Next.js. Never commit secrets to version control.

## Troubleshooting

### Issue: "Worktree already exists"

```
Error: Worktree already exists at .worktrees/AUX-37/
```

**Solution:** Either delete the old worktree or reuse it:
```bash
# Delete old worktree
rm -rf .worktrees/AUX-37/
git worktree prune

# Or reuse the worktree
/start-ticket ... --reuse-worktree
```

### Issue: "Failed to fetch issue from Linear"

```
Error: Failed to fetch issue from Linear (401: Unauthorized)
```

**Solution:** Add `LINEAR_API_KEY` to `.env.local` in the project root:
```env
LINEAR_API_KEY=lin_...
```
Then re-run the command.

Or provide the title manually:
```bash
/start-ticket https://linear.app/openaux/issue/AUX-37/... --title "Set up CI preview deploy"
```

### Issue: "Branch name does not match pattern"

```
Error: Branch name does not match pattern: ^(feat|fix|docs|...)/AUX-[0-9]+-[a-z0-9-]+$
```

**Solution:** Ensure branch type is valid and slug contains only lowercase letters, numbers, and hyphens:
```bash
# Correct: feat, fix, docs, refactor, test, chore, ci only
/start-ticket ... --type=feat  # ✓ Valid
/start-ticket ... --type=feature  # ✗ Invalid (use 'feat' instead)
```

### Issue: "PR title rejected by GitHub Actions"

```
Error: PR validation failed - title must start with AUX-###:
```

**Solution:** The `push-and-create-pr` skill should enforce this automatically. If manually editing the PR, ensure format:
```
AUX-37: Set up CI preview deploy  ✓ Correct
AUX-37 Set up CI preview deploy   ✗ Missing colon
Set up AUX-37                     ✗ Reference must be at start
```

### Issue: "Commits don't follow conventional format"

```
Error: Commit message does not follow conventional format
```

**Solution:** The `chunk-and-commit` skill should enforce this automatically. If manually committing, use correct format:
```bash
git commit -m "feat(ci): add GitHub Actions workflow"  # ✓ Correct
git commit -m "Add GitHub Actions workflow"            # ✗ Not conventional

# To bypass validation (emergency only):
git commit --no-verify -m "..."
```

## Maintenance

### Monitoring & Cleanup

Periodically clean up old worktrees:

```bash
# List all worktrees
git worktree list

# Remove deleted worktrees
git worktree prune

# Manually delete a worktree
rm -rf .worktrees/AUX-37/
git worktree prune
```

### Updating Workflow

If branch naming, commit, or PR format conventions change:

1. Update `scripts/start-ticket.mjs` and `scripts/create-worktree.mjs`
2. Update this documentation
3. Update corresponding docs in [docs/setup/linear.md](./linear.md)
4. Update GitHub Actions validation in [.github/workflows/pr-validate-linear.yml](.github/workflows/pr-validate-linear.yml)

## See Also

- [docs/setup/linear.md](./linear.md) — Linear issue and branch naming conventions
- [docs/operations/branch-protection.md](../operations/branch-protection.md) — Branch protection rules
- [docs/adr/](../adr/) — Architectural Decision Records
- [CONTEXT.md](../../CONTEXT.md) — Project domain language and terminology
