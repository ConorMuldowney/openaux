# OpenAux Linear Setup

This repo does not yet contain application code, so the practical way to connect Linear now is to attach the GitHub repository to a Linear team and establish issue, branch, and pull request conventions before implementation starts.

## Recommended workspace shape

- Workspace: existing product workspace
- Team: `OpenAux`
- Team key: `RAD`
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

- Branch name example: `rad-123-open-aux-lifecycle`
- PR title example: `RAD-123: implement open aux lifecycle state machine`
- PR description example: `Implements RAD-123`

Linear can link issues from:

- branch names that include the issue ID
- pull request titles that include the issue ID
- pull request titles or descriptions that use a magic word such as `fixes`, `implements`, `refs`, or `related to`

Recommended convention for this repo:

- use the issue ID in the branch name
- use the issue ID at the start of the PR title
- use `Implements RAD-123` or `Refs RAD-123` in the PR description

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

If you want GitHub to turn `RAD-123` into a clickable Linear link in PRs and comments, add a GitHub autolink reference in the repository settings.

Use this pattern:

- key prefix: `RAD`
- target URL: `https://linear.app/<workspace>/issue/RAD-<num>`

Replace `<workspace>` with your actual Linear workspace slug.

## Vercel previews

The current product direction calls for Vercel hosting. Once the app exists and the GitHub integration is connected, Linear can surface preview links from linked pull requests automatically when preview links are present.

## Suggested initial project structure

Create the `OpenAux V1` project in Linear and seed it with the following parent issues:

1. `RAD-1` Open Aux lifecycle and state machine
2. `RAD-2` Access control, identities, and invites
3. `RAD-3` Entry submission and required sample validation
4. `RAD-4` Ranked ballots, scoring, and tie-breaking
5. `RAD-5` Blind judging and post-results reveal
6. `RAD-6` Host controls for cancel and deadline extension
7. `RAD-7` Platform foundations: Next.js, Auth0, Prisma, Neon, R2, Inngest
8. `RAD-8` Test harness: Vitest, Playwright, test database, CI

## Suggested first implementation issues

Start with a narrow set of tracer-bullet issues under the project:

1. Create Next.js app shell with Tailwind, shadcn, and route handler support.
2. Add Auth0 login flow and verified-email enforcement middleware.
3. Model `OpenAux`, `Invite`, `Participant`, `Entry`, and `Ballot` in Prisma.
4. Implement the Open Aux state machine with guarded transitions.
5. Add policy checks for hosting, invite acceptance, submission, listening, and voting.
6. Build a host flow for creating an Open Aux with participation, listener, voter, and blind-judging scopes.

## Definition of done for Linear-connected work

- Every branch references one Linear issue.
- Every PR references one or more Linear issues.
- Merge automation transitions the linked issue without manual cleanup.
- Project work is grouped under `OpenAux V1` rather than tracked as unrelated standalone issues.