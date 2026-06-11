# ADR 0009: Time Handling and Deadline Boundaries

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase deadlines are user-facing across timezones and must behave consistently for all participants.

## Decision
Use UTC for persistence and enforcement, local time for presentation:
- All schedule timestamps are stored and enforced in UTC.
- Times are presented in each viewer's local timezone.
- Time windows are start-inclusive and end-exclusive.

## Consequences
- Prevents timezone drift in enforcement logic.
- Improves user comprehension of local deadlines.
- Requires careful client/server conversion boundaries and test coverage around edge times.

## Sources
- docs/product/prd.md
- docs/product/rules.md
