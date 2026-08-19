# ADR 0005: Submission Validity and Voiding

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase entries support fair progression into voting without requiring unverifiable audio analysis.

## Decision
Adopt the following submission model:
- Each participant can have exactly one final entry per showcase.
- Draft replacement is allowed until submission close; latest version counts.
- Hosts may provide optional reference samples for participants.
- Reference sample usage is not inferred or used to exclude Entries.
- If fewer than two Entries exist at submission close, the showcase is void and does not proceed to voting.

## Consequences
- Simplifies participant entry ownership and winner evaluation.
- Keeps reference material separate from Entry eligibility.
- Requires explicit handling of voided showcases in UX and lifecycle logic.

## Sources
- docs/product/prd.md
- docs/product/rules.md
