# OpenAux Showcase PRD

- Owner: Product + Platform Engineering
- Last reviewed: 2026-06-11

## Problem Statement

People want to host showcases where creators work from shared samples, listeners can follow the showcase, and voting stays fair, explainable, and easy to understand. The product needs to support both public and private showcases, clear participation rules, ranked voting, and predictable lifecycle behavior without allowing midstream rule changes that would undermine trust.

## Solution

OpenAux will provide showcases with separate scopes for participation, listening, and voting. Hosts will configure showcases before submissions open, including whether judging is blind by default, who may submit, who may listen, and who may vote. Participants will submit one final entry, listeners will be able to hear showcases according to the configured scope, and eligible voters will rank entries on a ballot. Voting will remain hidden until it closes, results will be deterministic, and showcases will finalize into an immutable state once voting ends.

## User Stories

1. As a host, I want to create a showcase with explicit participation, listening, and voting scopes, so that I can control who can enter, who can listen, and who can vote.
2. As a host, I want to require verified email before I can host a showcase, so that hosts are accountable.
3. As a host, I want blind judging to default on, so that showcases start with reduced popularity bias.
4. As a host, I want blind judging to be configurable before submissions open, so that I can choose whether identities are hidden during the showcase.
5. As a host, I want showcase settings that affect fairness to lock when submissions open, so that entrants are not subject to rule changes after they commit.
6. As a host, I want to choose whether a showcase is public or private for participation, so that I can invite only the people I want to compete.
7. As a host, I want to allow public listening, so that a showcase can be heard by anyone when I want it to be discoverable.
8. As a host, I want to allow private listening, so that I can keep some showcases visible only to invited listeners.
9. As a host, I want to choose whether voting is public or private, so that I can open the vote to all eligible users or restrict it to invited users.
10. As a host, I want to set the maximum number of ranked picks on a ballot, so that I can control how broad or narrow voting is.
11. As a host, I want to provide optional reference samples for a showcase, so that participants have creative guidance.
13. As a host, I want to cancel a showcase before voting opens, so that I can stop a showcase that is no longer viable.
14. As a host, I want to extend submission time while submissions are open, so that I can give participants more time when needed.
15. As a host, I want to extend voting time while voting is open, so that I can accommodate late participation without reopening submissions.
16. As a participant, I want to join a private showcase only when I have been explicitly invited, so that participation stays controlled.
17. As a participant, I want to accept an invite only after authenticating, so that private entry access is tied to a real account.
18. As a participant, I want to submit exactly one final entry per showcase, so that judging stays simple and fair.
19. As a participant, I want to replace my draft submission until submissions close, so that I can refine my track before locking it in.
20. As a participant, I want to know whether a showcase has enough entries to proceed, so that I am not waiting for a meaningless voting phase.
22. As a listener, I want to listen anonymously when a showcase allows public listening, so that I can discover showcases without creating an account.
23. As a listener, I want to listen only when I have invite access in a private showcase, so that private showcases remain private to the intended audience.
24. As an authenticated user, I want to vote in public showcases when voting is open to all eligible users, so that I can participate in showcases I am allowed to judge.
25. As an authenticated user, I want to vote in private showcases only when I am invited, so that voting access matches the host's intent.
26. As an authenticated user, I want to cast a ranked ballot instead of a single binary vote, so that I can express a fuller preference order.
27. As an authenticated user, I want to rank only some of the entries when I do not want to rank every Participant, so that voting stays flexible.
28. As an authenticated user, I want each Participant to appear at most once on my ballot, so that my ranking is unambiguous.
29. As an authenticated user, I want my ballot to stay editable until voting closes, so that I can correct mistakes before the deadline.
30. As a voter, I want ballots and totals hidden until voting ends, so that I am not influenced by live results.
31. As a voter, I want the system to count only my latest ballot, so that my final choice is clear.
32. As a voter, I want tie-breaking to be deterministic, so that equal scores still produce a clear winner.
33. As a voter, I want entries removed from scoring if they are disqualified, so that final results reflect only valid submissions.
34. As a showcase viewer, I want all timing to be shown in my local timezone, so that deadlines are easy to understand.
35. As a showcase viewer, I want timestamps to be stored in UTC, so that the system behaves consistently across regions.
36. As a showcase viewer, I want showcase states to be easy to understand, so that I know whether a showcase is open, voting, or finalized.
37. As a showcase viewer, I want invite links to become read-only after finalization, so that old links remain useful for historical access without reopening the showcase.
38. As a participant, I want creator identities hidden during active blind-judging phases, so that popularity bias is reduced.
39. As a participant, I want creator identities revealed when results publish, so that attribution returns after the showcase ends.

## Implementation Decisions

- Separate showcase rules into explicit participation, listening, voting, and blind-judging scopes.
- Require authenticated, verified accounts for hosting, inviting acceptance, submission, and voting.
- Support both public and private participation, with private participation gated by invitation.
- Support both public and private listening.
- Support both public and private voting, with public voting open to any authenticated user and private voting limited to invited authenticated users.
- Keep voting-related settings and blind-judging settings locked when submissions open.
- Allow listener scope changes after submissions open if needed.
- Model each participant as having one final entry per showcase, with draft replacement allowed until submissions close.
- Allow hosts to provide optional reference samples for participants.
- Do not infer sample usage or exclude entries based on reference samples.
- Use ranked ballots with a host-defined maximum rank count.
- Allow partial ballots, but require contiguous ranks and forbid duplicate Participants on a ballot.
- Score ballots with Borda-style points based on rank order.
- Hide ballots and live totals until voting closes.
- Allow ballot edits until voting closes and count only the latest ballot.
- Use deterministic tie-breaking based on rank counts, then submission timestamp.
- Recompute affected results when a disqualification occurs after voting begins.
- Treat showcase lifecycle as creation, submission open, voting open, and finalized.
- Enforce UTC storage for all scheduled times and local-time presentation in the UI.
- Use start-inclusive and end-exclusive deadline boundaries.
- Keep blind judging enabled by default and reveal identities only when results publish.

## V1 Tech Stack Decision Record

- Architecture: Modular monolith.
- Language: TypeScript.
- App framework: Next.js (full-stack App Router).
- API style: Route Handlers with Zod validation.
- Database: PostgreSQL on Neon.
- Data access: Prisma (with targeted SQL where needed).
- Authentication: Auth0 (verified email required for host and voter actions).
- Hosting: Vercel.
- Object storage: Cloudflare R2.
- Media strategy: Compress uploads to normalized streaming assets; keep originals for 30 days, then retain normalized versions unless under dispute.
- Jobs/orchestration: Async queue workers via Inngest.
- Authorization model: Domain policy engine per action/resource.
- Lifecycle model: Explicit state machine with guarded transitions and transition audit events.
- Scoring/result model: Live deterministic compute during voting; immutable final snapshot at showcase finalization.
- Invite model: Single-use invite tokens bound to accepted identity.
- Frontend styling: Tailwind CSS and shadcn/ui with project tokens.
- Testing: Vitest + Playwright + Prisma test database.
- Observability: Sentry + structured logs + uptime checks.
- CI/CD: GitHub Actions with preview deploys on pull requests and protected production deploys on main.
- Deferred decision: Runtime platform for FFmpeg/transcoding workers.

## Testing Decisions

- Test external behavior at the showcase-rule boundary rather than internal implementation details.
- Cover access-control behavior for hosting, invite acceptance, submission, listening, and voting.
- Cover submission validation for single-entry ownership, draft replacement, required-sample completeness, and insufficient-valid-entry handling.
- Cover ballot validation for ranking limits, duplicate Participants, contiguous ranks, and partial ballots.
- Cover scoring behavior for Borda-style point allocation and deterministic tie-breaking.
- Cover lifecycle behavior for settings locks, voting visibility, ballot edit windows, finalization, and read-only invite links.
- Cover identity visibility behavior for blind judging during active phases and reveal on publish.
- Use the same high-level seams implied by the product rules: access control, submission, ballot system, voting lifecycle, scoring, blind judging, and showcase lifecycle.

## Out of Scope

- Fraud detection, sockpuppet handling, and retrospective vote correction.
- Automated audio analysis for required-sample compliance.
- Public comment threads, messaging, or social features.
- Monetary payouts, prize management, or tax handling.
- Multi-round tournament brackets beyond a single showcase.
- Reopening submissions after they close.
- Host-defined voter caps in public voting mode.

## Further Notes

- The rules are designed to keep showcase configuration explicit before the showcase starts and stable once submissions open.
- This PRD assumes the product will treat public listening as discoverable access and private listening as invite-only access.
- The PRD intentionally keeps fraud handling open for a later decision.
- The most important product guarantee is that the voting phase is deterministic and not subject to midstream rule changes.