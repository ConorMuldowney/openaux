# ADR 0008: Lifecycle and Finalization Model

- Owner: Platform Engineering
- Last reviewed: 2026-06-11

- Status: Accepted
- Date: 2026-06-09

## Context
Showcase operations require clear stage boundaries for submissions, voting, mutability, and final publication.

## Decision
Model lifecycle with explicit states and immutable finalization:
- Creation
- Submission Open
- Voting Open
- Finalized

Rules:
- Host can cancel only before voting opens.
- Submission close may be extended only while submissions are open and before voting starts.
- Submissions cannot be reopened after close.
- Voting close may be extended only while voting is open.
- After voting closes, the showcase is finalized and immutable.
- Invite links remain available as read-only after finalization.

## Consequences
- Reduces ambiguity for state transitions and allowed actions.
- Supports guarded transitions and lifecycle audits.
- Requires strict enforcement of mutation constraints by state.

## Sources
- docs/product/prd.md
- docs/product/rules.md
