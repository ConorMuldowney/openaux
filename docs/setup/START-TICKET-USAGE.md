# Start-Ticket Workflow — User Guide

A **single-command, fully autonomous workflow** for taking a Linear or GitHub issue from creation to open pull request.

## Quick Start

```bash
# Terminal (one-time per ticket)
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/add-integration-tests

# Then in VS Code Copilot Chat (handles the entire workflow)
/start-ticket https://linear.app/openaux/issue/AUX-64/add-integration-tests
```

That's it. The agent will:
- ✓ Implement the solution
- ✓ Organize commits
- ✓ Push the branch
- ✓ Create a PR

---

## Two-Step Process

### Step 1: Terminal — Create Worktree (30 seconds)

In your terminal, run:

```bash
npm run start-ticket -- <url> [--type <type>] [--title <title>]
```

**Examples:**

```bash
# From a Linear issue URL
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/add-integration-tests

# From a GitHub issue URL (must have AUX-### reference in title or body)
npm run start-ticket -- https://github.com/ConorMuldowney/openaux/issues/123

# Override the detected type (feat, fix, docs, refactor, test, chore, ci)
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/... --type test

# Skip API call and provide title manually
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/... --title "AUX-64: Add integration tests"
```

**Terminal Output:**

```
─────────────────────────────────────────────────────
✓ Setup complete!

  Worktree: .worktrees/AUX-64
  Branch:   feat/AUX-64-invite-accept-race-conditions
  Issue:    AUX-64 — Add integration tests for invite-accept API
  
  Next step — Run in Copilot Chat:
  /start-ticket https://linear.app/openaux/issue/AUX-64/...
─────────────────────────────────────────────────────
```

**What just happened:**
- ✓ Issue metadata extracted (number, title, type)
- ✓ Semantic branch name generated (e.g., `feat/AUX-64-invite-accept-race-conditions`)
- ✓ Isolated Git worktree created at `.worktrees/AUX-64/`
- ✓ Feature branch created from `develop`

**Stop here if there are errors.** The terminal will report them clearly.

---

### Step 2: Agent Chat — Full Workflow (3–6 minutes)

Open VS Code and invoke the agent in Copilot Chat:

```
/start-ticket https://linear.app/openaux/issue/AUX-64/add-integration-tests-for-invite-accept-api-including-race-conditions
```

Or use the shorter form (same issue number):

```
/start-ticket https://linear.app/openaux/issue/AUX-64/...
```

**What the agent does automatically:**

#### Phase 1: Parse Issue (10 seconds)
- Validates the URL
- Extracts issue number, title, and type
- Confirms the worktree was created in Step 1

#### Phase 2: Implement (1–2 minutes)
- Reads CONTEXT.md and all relevant ADRs
- Analyzes the codebase for patterns and conventions
- Implements the solution with full test coverage
- Runs tests (`npm run test:unit`, `npm run test:integration`)
- **Stops if tests fail**—you'll need to fix and re-run

#### Phase 2b: Verify Tests (30 seconds)
- Runs full test suite one final time: `npm run test:unit && npm run test:integration`
- **Stops if any test fails**—you'll need to fix and re-run
- Ensures all changes are working before organizing commits

#### Phase 3: Chunk Commits (1 minute)
- Inspects all changes in the worktree
- Groups related changes into logical commits
- Generates conventional commit messages: `<type>(<scope>): <description>`
- Validates against commitlint rules

**Example commits:**
```
feat(invites): add race condition detection
test(invites): add integration test for simultaneous accepts
test(invites): add edge case tests for invalid states
```

#### Phase 4: Push & Create PR (30 seconds)
- Pushes the branch to origin
- Creates a pull request targeting `develop`
- Enforces PR title format: `AUX-###: <title>`
- Returns the PR URL

#### Phase 5: Summary Report (Instant)
```
╔════════════════════════════════════════════════════════════════╗
║                    TICKET WORKFLOW COMPLETE                    ║
╚════════════════════════════════════════════════════════════════╝

  Issue:        AUX-64: Add integration tests for invite-accept API
  Worktree:     .worktrees/AUX-64/
  Branch:       feat/AUX-64-invite-accept-race-conditions
  
  Commits:
    • test(invites): add integration test for basic acceptance
    • test(invites): add race condition test for simultaneous accepts
    • test(invites): add edge case tests for invalid states
  
  PR:           AUX-64: Add integration tests for invite-accept API
  URL:          https://github.com/ConorMuldowney/openaux/pull/###
  
  Status:       Ready for review
```

---

## Prerequisites

### Installed Tools
- **Node.js** 18+ (for scripts)
- **Git** 2.13+ (for worktree support)
- **npm** (for running scripts)

Verify:
```bash
node --version    # Should be v18+
git --version     # Should be 2.13+
npm --version
```

### Environment Variables (Optional)

Set these in `.env.local` in the project root (already gitignored):

```env
LINEAR_API_KEY=lin_...          # For fetching Linear issue metadata
GITHUB_TOKEN=ghp_...            # For GitHub issue access (optional for public repos)
WORKTREE_BASE_PATH=.worktrees/  # Custom worktree location (defaults to .worktrees/)
```

**To get your Linear API key:**
1. Go to [Linear settings → API](https://linear.app/account/api)
2. Create a new API key
3. Add to `.env.local`: `LINEAR_API_KEY=lin_...`

**Without these keys:**
- Linear issues can still be fetched if they're public or you pass `--title`
- GitHub issues work without a token for public repos

### Skills Available

The workflow delegates to three existing skills. Verify they're installed:

- `tackle-ticket-with-docs` — Implements the solution
- `chunk-and-commit` — Organizes commits
- `push-and-create-pr` — Creates the PR

These should already be available in your VS Code environment.

---

## Common Workflows

### Example 1: Add Integration Tests

**Terminal:**
```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/add-integration-tests-for-invite-accept-api-including-race-conditions
```

**Agent Chat:**
```
/start-ticket https://linear.app/openaux/issue/AUX-64/add-integration-tests-for-invite-accept-api-including-race-conditions
```

**Result:** PR with test commits automatically created and pushed.

---

### Example 2: Fix a Bug with Type Override

**Terminal:**
```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-42/fix-race-condition --type fix
```

**Agent Chat:**
```
/start-ticket https://linear.app/openaux/issue/AUX-42/fix-race-condition
```

**Result:** PR with `fix/` prefix and bug fix commits.

---

### Example 3: Documentation Update

**Terminal:**
```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-99/add-lifecycle-docs --type docs
```

**Agent Chat:**
```
/start-ticket https://linear.app/openaux/issue/AUX-99/add-lifecycle-docs
```

**Result:** PR with `docs/` prefix, documentation commits, and code examples.

---

### Example 4: Work on Multiple Tickets in Parallel

Each ticket gets its own isolated worktree, so you can work on multiple without branch switching:

```bash
# Terminal 1: Ticket AUX-64
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/...

# Terminal 2: Ticket AUX-99
npm run start-ticket -- https://linear.app/openaux/issue/AUX-99/...

# Chat: Handle both independently
/start-ticket https://linear.app/openaux/issue/AUX-64/...  # Opens PR for AUX-64
/start-ticket https://linear.app/openaux/issue/AUX-99/...  # Opens PR for AUX-99
```

Worktrees remain at `.worktrees/AUX-64/` and `.worktrees/AUX-99/` until you clean them up.

---

## Branch & Commit Conventions

The workflow automatically enforces these standards:

### Branch Names

Format: `<type>/AUX-<number>-<slug>`

**Valid types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

**Examples:**
- `feat/AUX-64-invite-accept-race-conditions`
- `fix/AUX-42-state-transition-race`
- `docs/AUX-99-lifecycle-documentation`

### Commit Messages

Format: `<type>(<scope>): <description>`

**Examples:**
- `feat(invites): add race condition detection for simultaneous accepts`
- `test(invites): add integration tests for edge cases`
- `fix(lifecycle): resolve state transition race condition`

**Types:** feat, fix, docs, refactor, test, chore, ci  
**Scope:** The module or feature (e.g., `invites`, `scoring`, `lifecycle`)  
**Description:** Present tense, lowercase, no period

Validated by Husky + commitlint before commit.

### PR Titles

Format: `AUX-###: <title>`

**Valid:**
- ✓ `AUX-64: Add integration tests for invite-accept API`
- ✓ `AUX-42: Fix state transition race condition`

**Invalid (rejected by CI):**
- ❌ `Add integration tests` (missing AUX reference)
- ❌ `AUX-64 Add tests` (missing colon and space)
- ❌ `invite-accept: AUX-64` (reference must be first)

The `push-and-create-pr` skill enforces this automatically.

---

## Troubleshooting

### Issue: "Worktree already exists"

**Error:**
```
Error: Worktree already exists at .worktrees/AUX-64
```

**Solution:**

Delete the old worktree and try again:

```bash
# PowerShell
Remove-Item -Recurse -Force .worktrees/AUX-64
git worktree prune

# Then re-run
npm run start-ticket -- https://...
```

Or reuse the existing worktree by continuing with Step 2 (agent chat).

---

### Issue: "Failed to fetch issue from Linear"

**Error:**
```
Error: Failed to fetch issue from Linear (401: Unauthorized)
```

**Solution:**

Add your Linear API key to `.env.local`:

```env
LINEAR_API_KEY=lin_...
```

Then re-run:

```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/...
```

**Alternative:** Pass the title manually:

```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/... --title "AUX-64: My title"
```

---

### Issue: "Branch name does not match pattern"

**Error:**
```
Error: Branch name does not match pattern: ^(feat|fix|docs|...)/AUX-[0-9]+-[a-z0-9-]+$
```

**Cause:** The slug contains invalid characters (uppercase, special chars, spaces).

**Solution:** Ensure you're using a lowercase, kebab-case slug:

```bash
# ✗ Wrong
npm run start-ticket -- https://linear.app/.../My_Feature_Name

# ✓ Correct (auto-converted)
npm run start-ticket -- https://linear.app/.../my-feature-name
```

The script automatically converts titles to valid slugs, so this is rare.

---

### Issue: "Tests failed during implementation"

**Error:**
```
✗ Tests failed:
  FAIL src/api/invites/accept.integration.test.ts
  
  The agent will not proceed until tests pass.
```

**Solution:**

The agent will report which tests failed and why. Review the error messages:

1. Look at the test output in the agent's response
2. Open the worktree in another terminal: `cd .worktrees/AUX-64`
3. Debug locally:
   ```bash
   npm run test:unit -- path/to/test.ts
   npm run test:integration
   ```
4. Ask the agent to retry implementation:
   ```
   /start-ticket https://... --reimplement
   ```

---

### Issue: "PR title rejected by GitHub Actions"

**Error:**
```
✗ PR validation failed - title must start with AUX-###:
```

**Cause:** The PR title is malformed (missing colon, reference in wrong place, etc).

**Solution:**

The `push-and-create-pr` skill enforces the correct format. If you see this error:

1. Check the PR title on GitHub
2. Edit it to match: `AUX-###: <title>`
3. The CI workflow will re-run automatically

**Example corrections:**
- ❌ `Add integration tests` → ✓ `AUX-64: Add integration tests`
- ❌ `AUX-64 Add tests` → ✓ `AUX-64: Add integration tests`
- ❌ `Tests AUX-64` → ✓ `AUX-64: Add integration tests`

---

### Issue: "Commits don't follow conventional format"

**Error:**
```
✗ Commit message does not follow conventional format
```

**Cause:** A commit message doesn't match `<type>(<scope>): <description>`.

**Solution:**

The `chunk-and-commit` skill enforces conventional format. If this fails:

1. The agent will report which commit was invalid
2. Ask the agent to re-chunk:
   ```
   /chunk-and-commit <worktree-path>
   ```

---

### Issue: "Cannot access worktree directory"

**Error:**
```
Cannot find or access .worktrees/AUX-64
```

**Cause:** The worktree path is wrong or the directory was deleted.

**Solution:**

Verify the worktree exists:

```bash
git worktree list
```

If it's gone, start over:

```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/...
```

---

## Cleanup

### After PR is Merged

Once your PR is merged into `develop`, you can safely delete the worktree:

```bash
Remove-Item -Recurse -Force .worktrees/AUX-64
git worktree prune
```

Or keep it for reference and testing.

### Clean Up All Worktrees

```bash
Remove-Item -Recurse -Force .worktrees/*
git worktree prune
```

**Note:** This only deletes the worktree directories. The branches remain in Git.

---

## Advanced Options

### Override Branch Type

If the issue type is misdetected, override it:

```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/... --type fix
```

**Valid types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

---

### Provide Title Manually (Skip API Call)

If you can't or don't want to fetch the issue from the API:

```bash
npm run start-ticket -- https://linear.app/openaux/issue/AUX-64/... --title "AUX-64: Add integration tests"
```

---

### Custom Worktree Location

Set the worktree base path in `.env.local`:

```env
WORKTREE_BASE_PATH=/custom/path/worktrees
```

Then run:

```bash
npm run start-ticket -- https://...
```

Worktrees will be created at `/custom/path/worktrees/AUX-<number>/`.

---

## Reference Documentation

- **Full workflow architecture:** [docs/setup/ticket-to-pr-workflow.md](ticket-to-pr-workflow.md)
- **Branch & commit conventions:** [docs/setup/linear.md](linear.md)
- **Domain language & ADRs:** [docs/adr/](../adr/)
- **Workspace instructions:** [.instructions.md](../../.instructions.md)

---

## Summary

| Step | What Happens | Where | Duration |
|------|--------------|-------|----------|
| **1. Terminal** | Create worktree + branch | Terminal | 30 sec |
| **2. Agent: Implement** | Code solution with tests | Copilot Chat | 1–2 min |
| **3. Agent: Chunk** | Organize into commits | Copilot Chat | 1 min |
| **4. Agent: Push & PR** | Create PR on GitHub | Copilot Chat | 30 sec |
| **5. Agent: Report** | Summary + PR URL | Copilot Chat | Instant |

**Total time:** ~3–5 minutes for a typical ticket.

---

## Need Help?

- Check [Troubleshooting](#troubleshooting) above
- Review the full [workflow documentation](ticket-to-pr-workflow.md)
- Check your issue's Linear page for requirements
- Review relevant [ADRs](../adr/) for architectural context
