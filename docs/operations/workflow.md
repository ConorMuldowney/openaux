# Development Workflow

- Owner: Platform Engineering
- Last reviewed: 2026-06-12

End-to-end process from picking up a Linear ticket to opening a pull request.

---

## 1. Pick Up a Ticket

1. Open the [Linear](./linear.md) board and move the ticket from `Backlog` / `Todo` → **`In Progress`**.
2. Note the issue ID (e.g., `AUX-123`) — it is required in the branch name and PR title.

---

## 2. Create a Branch (or Worktree)

Branches follow the pattern `<type>/AUX-<number>-<slug>`. See [Git Conventions](./git.md#branch-naming-convention) for the full type prefix list.

### Standard branch

```bash
git switch main
git pull
git switch -c feat/AUX-123-my-feature-slug
```

### Git worktree (parallel work without stashing)

Use a worktree when you need to keep the main checkout clean while working on multiple issues simultaneously.

```bash
# From the repo root
git fetch origin
git worktree add ../openaux-AUX-123 -b feat/AUX-123-my-feature-slug origin/main
cd ../openaux-AUX-123
npm install   # install deps in the new worktree
```

Each worktree has its own working directory and index but shares the git object store. Remove it when done:

```bash
git worktree remove ../openaux-AUX-123
```

---

## 3. Develop

Run the dev server:

```bash
npm run dev
```

If your change involves schema modifications, create a migration before writing code:

```bash
npm run prisma:migrate:dev -- --name <migration_name>
```

See [Database and Migrations](./database.md) for the full database workflow.

---

## 4. Commit

Commits use [Conventional Commits](https://www.conventionalcommits.org/) format, enforced by the Husky `commit-msg` hook. See [Git Conventions](./git.md#commit-messages) for the full spec.

### Chunking commits

Prefer several small, focused commits over one large one. Each commit should represent a single logical change that could be described in one conventional-commit line. Good chunking makes review easier and keeps `git bisect` useful.

Typical chunking patterns:

| Situation | Separate commits |
|---|---|
| Schema change + application code | migration first, then feature code |
| New helper + feature that uses it | helper first, then feature |
| Bug fix found while building a feature | fix commit, then feature commit |
| Test added alongside implementation | implementation first, then tests (or interleaved per red-green cycle) |
| Docs updated alongside code | code commit, then docs commit |

### Staging selectively

Use `git add -p` (interactive patch) to stage only the hunks that belong to the current logical change, leaving unrelated edits for a later commit:

```bash
git add -p                    # review and stage hunks one by one
git diff --staged             # verify exactly what is about to be committed
git commit -m "feat(scoring): implement tie-break logic for ranked ballots"
```

For new files not yet tracked, stage them explicitly before `git add -p`:

```bash
git add src/modules/scoring/tie-break.ts   # stage new file
git add -p                                  # patch-stage changes in existing files
```

### Commit message format

```
<type>(<scope>): <short description>

<optional body — explain WHY, not what>
```

Examples:
- `feat(scoring): implement tie-break logic for ranked ballots`
- `fix(lifecycle): resolve race condition in state transition`
- `test(scoring): add edge cases for partial ballot scoring`
- `refactor(api): simplify route handler contracts`

The body is optional but valuable when the motivation is not obvious from the diff. If `commitlint` rejects the message, fix the format — do not use `--no-verify`.

---

## 5. Pre-push Quality Check

Run all checks locally before pushing to avoid a failed CI run:

```bash
npm run lint          # ESLint (zero warnings) + domain-language check
npm run typecheck     # TypeScript strict mode
npm run build         # Next.js production build (also runs prisma generate) — REQUIRED
npm run test:unit     # Vitest unit tests
```

For changes that touch database-connected code, also run integration tests (requires a reachable `TEST_DATABASE_URL`):

```bash
npm run test:integration
```

### Quick iteration vs. final verification

**During development iteration** (fixing errors repeatedly):
- Use `npm run typecheck:changed` to typecheck only your modified files — this avoids pre-existing errors hiding your new issues.
- Always include `npm run build` — the Next.js build catches Prisma composite key errors and other generic type issues that typecheck alone misses.

**Before final push**:
- Run the full `npm run typecheck` to ensure no regressions in unmodified files.
- Confirm `npm run build` succeeds one more time.

### Fixing common failures

| Failure | Fix |
|---|---|
| Lint error | Follow the ESLint message; re-run `npm run lint` to confirm |
| Domain-language violation | Check `scripts/check-domain-language.mjs` output; rename the offending symbol to use canonical domain language |
| TypeScript error | Fix the type error; `npm run typecheck` is watch-less — run it again to confirm |
| Build error | Usually a missing import, invalid export, or Prisma type mismatch; fix and re-run `npm run build` |
| Test failure | Fix the failing test or the code under test; do not skip tests |

---

## 6. Push

```bash
git push -u origin feat/AUX-123-my-feature-slug
```

GitHub Actions automatically runs the `quality` workflow (lint, typecheck, build) on every push. Watch the **Actions** tab if you need to confirm CI passes before requesting review.

---

## 7. Open a Pull Request

1. Open a PR against `main` on GitHub.
2. **Set the PR title** to `AUX-###: <concise summary>` — this is required for merge and auto-links the Linear issue. See [Git Conventions](./git.md#pull-request-title-convention).
3. In the PR description, include a magic word to trigger Linear automation on merge:
   - `Fixes AUX-123` — closes the issue and marks it `Done`
   - `Implements AUX-123` — moves to `In Review`
   - `Refs AUX-123` — links without a state change
4. Verify all required status checks are green. See [GitHub Platform Standards](./github.md#merge-requirements) for the full merge checklist.
5. Request a review.

---

## 8. Address Review Feedback

1. Push additional commits to the same branch — reviews are automatically dismissed on new commits, so your reviewer will be prompted to re-approve.
2. Re-run the local quality checks after any non-trivial change (step 5).
3. Keep the branch up-to-date: if `main` has moved, click **Update branch** on the PR (or `git rebase origin/main` locally and force-push).

---

## 9. Merge

Once all checks pass and you have at least one approval, merge via the GitHub UI. The Linear issue transitions automatically based on the magic word in the PR description.

After merge, clean up:

```bash
git switch main
git pull
git branch -d feat/AUX-123-my-feature-slug   # delete local branch
```

---

## Reference

| Topic | Document |
|---|---|
| Branch naming, commit format, PR titles | [git.md](./git.md) |
| CI checks and merge requirements | [github.md](./github.md) |
| Linear states and auto-linking | [linear.md](./linear.md) |
| Database migrations | [database.md](./database.md) |
