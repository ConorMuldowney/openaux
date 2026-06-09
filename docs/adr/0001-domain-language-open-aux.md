# ADR 0001: Domain Language for Open Aux

- Status: Accepted
- Date: 2026-06-09

## Context
The product documentation defines a specific domain language for Radio Pesto to avoid ambiguity and legacy terminology drift. The current docs explicitly state preferred terms and terms to avoid.

## Decision
Use the Open Aux domain vocabulary as the canonical language across product, engineering, and documentation.

Canonical terms include:
- Open Aux
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
- Open Aux Finalization

Legacy terms such as battle, contest, challenge, event, admin, organizer, and competitor are non-canonical and should be phased out in implementation-facing materials.

## Consequences
- Improves consistency across PRDs, rules, code comments, and issue tracking.
- Reduces misunderstanding between product and implementation.
- Requires migration of existing legacy wording in future docs and UI copy.

## Sources
- CONTEXT.md
- docs/open-aux-prd.md
- docs/open-aux-rules.md
