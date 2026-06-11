# ADR 0006: Ranked Ballots and Scoring Model

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
The product requires expressive but constrained voting that is understandable to users and deterministic for result computation.

## Decision
Use ranked ballots with host-configured maximum picks and Borda-style scoring:
- Host configures maximum rank count N.
- Voters may submit partial ballots.
- A participant can appear at most once on a ballot.
- Ranks must be contiguous from 1 through k.
- Rank 1 receives N points, rank 2 receives N-1, and so on.
- Ballots and totals remain hidden until voting closes.
- Voters may edit ballots until voting closes.
- Only the latest ballot counts.

## Consequences
- Captures richer preference order than single-pick voting.
- Enables deterministic score computation.
- Requires strict ballot validation and replacement semantics.
- Requires result-visibility controls during active voting.

## Sources
- docs/product/prd.md
- docs/product/rules.md
