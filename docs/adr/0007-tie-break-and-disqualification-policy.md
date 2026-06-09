# ADR 0007: Tie-Break and Disqualification Policy

- Status: Accepted
- Date: 2026-06-09

## Context
Ranked scoring can produce tied totals, and entries may be disqualified after voting has started. Final results must remain predictable.

## Decision
Apply deterministic tie-break and disqualification handling:
- Tie-break order is count of first-rank votes, then second-rank votes, then third-rank votes, and so on.
- If still tied after all ranks, earlier submission timestamp wins.
- If an entry is disqualified after voting starts, remove it from final scoring.
- Preserve ballots, compress affected ranks, and recompute totals.

## Consequences
- Guarantees a deterministic winner ordering.
- Avoids ambiguous manual resolution flows.
- Requires stable rank-count bookkeeping and recomputation logic.
- Requires auditability around post-start disqualification events.

## Sources
- docs/open-aux-prd.md
- docs/open-aux-rules.md
