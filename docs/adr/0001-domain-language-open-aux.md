# ADR 0001: Domain Language for Showcases

- Status: Accepted
- Date: 2026-06-09

## Context
The product documentation defines a specific domain language for OpenAux to avoid ambiguity and legacy terminology drift. The current docs explicitly state preferred terms and terms to avoid.

## Decision
Use showcase-centered domain vocabulary as the canonical language across product, engineering, and documentation.

Canonical terms include:
- Showcase
- Host
- Participant
- Entry
- Required Sample
- Invite
- Participation Scope
- Listener Scope
- Voter Scope
- Ranked Ballot
- Blind Judging
- Showcase Finalization

Legacy terms such as battle, contest, challenge, event, admin, organizer, and competitor are non-canonical and should be phased out in implementation-facing materials.

## Consequences
- Improves consistency across PRDs, rules, code comments, and issue tracking.
- Reduces misunderstanding between product and implementation.
- Requires migration of existing legacy wording in future docs and UI copy.

## Sources
- CONTEXT.md
- docs/open-aux-prd.md
- docs/open-aux-rules.md
