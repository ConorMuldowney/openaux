# Linear Integration

- Owner: Platform Engineering
- Last reviewed: 2026-06-12

OpenAux uses Linear for issue tracking. Code changes are automatically linked to Linear issues through branch names and PR titles.

## Workflow States

- `Backlog` — Identified but not prioritized
- `Todo` — Ready to start
- `In Progress` — Currently being worked on
- `In Review` — Awaiting code review
- `Done` — Completed and merged
- `Canceled` — Abandoned or descoped

## Automatic Linking

When you follow [Git conventions](git.md) (branch naming: `<type>/AUX-###-<slug>`, PR title: `AUX-###: <description>`):

1. Push your branch to GitHub
2. Open a PR with the issue reference in the title
3. Linear automatically detects and links the PR to the issue
4. PR activity (comments, reviews) appears in the Linear issue
5. PR merge automatically transitions the issue (based on team automation settings)

Use magic words in PR descriptions to trigger state transitions on merge:
- `Implements AUX-123` — moves to `In Review`
- `Refs AUX-123` — links without state change
- `Fixes AUX-123` — links and moves to `Done`

## Troubleshooting

**PR not linking to Linear issue**
- Check that PR title matches pattern `AUX-###: <description>` (note colon and space)
- Verify GitHub-Linear integration is connected in Linear settings
- Check that your GitHub account is connected to your Linear account

**Wrong issue linked**
- Verify you used the correct issue number in branch name and PR title
- Re-open the PR with the correct reference if needed

**Issue status not updating on merge**
- Confirm PR automation is configured in Linear team workflow settings
- Verify the PR description includes a magic word like `Implements AUX-123`
- Check that you merged to `main` (not another branch)

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