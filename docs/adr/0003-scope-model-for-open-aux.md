# ADR 0003: Scope Model for Showcases

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase workflows require separate control of who can submit, who can listen, who can vote, and whether identities are hidden during active phases.

## Decision
Model showcase configuration with four explicit scopes:
- Participation Scope
- Listener Scope
- Voter Scope
- Blind-Judging Scope

Policy details:
- Private participation is invite-only.
- Public voters are any authenticated users.
- Private voters are invited authenticated users.
- Participants cannot vote in the same showcase they entered.
- Blind judging defaults to enabled and controls identity visibility during active phases.

## Consequences
- Makes access behavior explicit and testable.
- Avoids coupling listening, submission, and voting policies.
- Introduces additional policy state that must be validated at every boundary.

## Sources
- docs/product/prd.md
- docs/product/rules.md
