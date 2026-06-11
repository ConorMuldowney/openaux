# ADR 0002: Access and Identity Requirements

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase workflows include hosting, invites, submission, listening, and voting. Fairness and accountability require explicit identity rules by action type.

## Decision
Adopt the following access and identity policy:
- Hosting requires authentication and verified email.
- Voting requires authentication and verified email.
- Invite acceptance requires authentication prior to acceptance.
- Public listening allows anonymous or authenticated users.
- Private listening is invite-only.

## Consequences
- Enables accountable hosts and voters.
- Preserves low-friction discovery for public listening.
- Increases implementation complexity for invite-gated access checks.
- Requires robust session and identity verification pathways.

## Sources
- docs/product/prd.md
- docs/product/rules.md
