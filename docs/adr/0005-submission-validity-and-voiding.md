# ADR 0005: Submission Validity and Voiding

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase entries must satisfy common creative constraints and support fair progression into voting.

## Decision
Adopt the following submission model:
- Each participant can have exactly one final entry per showcase.
- Draft replacement is allowed until submission close; latest version counts.
- Each showcase must define at least one required sample.
- An entry is valid only if all required samples are present.
- If fewer than two valid entries exist at submission close, the showcase is void and does not proceed to voting.

## Consequences
- Simplifies participant entry ownership and winner evaluation.
- Enforces consistent creative constraints across entries.
- Requires deterministic validity evaluation at submission close.
- Requires explicit handling of voided showcases in UX and lifecycle logic.

## Sources
- docs/product/prd.md
- docs/product/rules.md
