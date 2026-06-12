# CI Workflow Improvements for Ticket-to-PR

**Issue:** AUX-27 build error (Prisma composite key type mismatch) was not caught during earlier typecheck runs, only during final `npm run build`.

**Root Cause:**
1. Typecheck output was truncated, hiding errors in changed files
2. Many pre-existing errors in other files masked new errors
3. The `npm run build` step was not explicitly required in quick CI iterations
4. No mechanism to focus on changed-file errors during iteration

## Changes Made

### 1. New Scripts

- **`scripts/typecheck-changed.ps1`** (PowerShell)
  - Runs typecheck only on TypeScript/TSX files changed vs. `origin/develop`
  - Avoids pre-existing errors masking new issues
  - Usage: `.\scripts\typecheck-changed.ps1 develop`

- **`scripts/typecheck-changed.sh`** (Bash)
  - Same functionality for Unix/Linux environments
  - Usage: `./scripts/typecheck-changed.sh develop`

### 2. Package.json Updates

Added npm script:
```json
"typecheck:changed": "pwsh -Command \"& .\\scripts\\typecheck-changed.ps1 develop || exit $LASTEXITCODE\""
```

Allows running: `npm run typecheck:changed`

### 3. Documentation Updates

#### `docs/operations/workflow.md`
- Expanded "Pre-push Quality Check" section with explicit distinction between:
  - **Quick iteration**: Use `npm run typecheck:changed` to focus on your changes
  - **Final verification**: Use full `npm run typecheck` before push
- Emphasized that `npm run build` is **REQUIRED** — it catches Prisma errors
- Added Prisma type errors to "Fixing common failures" table
- Clarified `TEST_DATABASE_URL` requirement for integration tests

#### `.agents/skills/run-local-ci/SKILL.md` (Local customization)
- Added guidance on using `typecheck:changed` in quick iterations
- Emphasized that build step is non-negotiable and catches issues typecheck misses
- Updated quality stage documentation

#### `.agents/skills/ticket-to-pr-workflow/SKILL.md` (Local customization)
- Expanded step 5 (Run CI Fix Loop) with explicit guidance:
  - Use `typecheck:changed` during quick iterations
  - Always include `npm run build` step
  - Run focused test suites initially
- Updated step 6 (Run Final Full Parity CI) to mandate full pipeline:
  - Complete quality stage (lint + full typecheck + build)
  - Complete test suite (unit + integration + e2e)
  - Documented that build step is non-negotiable

## How Future Workflows Will Benefit

When running `/ticket-to-pr-workflow` on a new ticket:

1. **Quick CI Loop** (fix cycles):
   - `npm run lint` → fails fast on linting issues
   - `npm run typecheck:changed` → only checks files you modified
   - `npm run build` → catches Prisma type errors, generic instantiation errors
   - `npm run test:unit` (focused) → runs only relevant tests

2. **Full CI Verification** (before commit):
   - `npm run lint` → all files
   - `npm run typecheck` → all files (catch regressions)
   - `npm run build` → full build
   - `npm run test:unit` + `npm run test:integration` → full suites

3. **Result**: Prisma type errors like the AUX-27 issue will be caught immediately in step 1, preventing wasted cycles pushing to CI.

## Testing the Improvement

To test locally:
```bash
# Make a change that introduces a Prisma type error
npm run typecheck:changed          # (would skip it if no error)
npm run build                      # ← Catches the error immediately
```

Versus before:
```bash
npm run typecheck                  # May miss error due to pre-existing issues
# Error only caught at push when CI runs build step
```
