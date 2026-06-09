# ADR 0004: Rule Locking and Mutability

- Status: Accepted
- Date: 2026-06-09

## Context
Rule changes after participants commit submissions can undermine fairness and trust. Some settings must lock, while others can remain mutable.

## Decision
Lock fairness-critical configuration when submissions open:
- Voting-related settings lock at submission open.
- Blind-judging setting locks at submission open.

Allow listener settings to remain mutable at any stage.

## Consequences
- Preserves competitive integrity after commitments are made.
- Reduces risk of midstream voting-rule manipulation.
- Requires clear lifecycle transition logic and guarded updates.
- Requires UI and API feedback for attempted post-lock changes.

## Sources
- docs/open-aux-prd.md
- docs/open-aux-rules.md
