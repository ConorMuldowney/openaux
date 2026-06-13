/**
 * Spec-gap tests for deterministic tie-break and disqualification recomputation
 * at the lifecycle finalization route (POST /api/lifecycle/transition → finalized).
 *
 * PRD rules (ADR-0007):
 * - Tie-break order: most first-rank votes, then second-rank votes, etc.
 * - If still tied: earlier submission timestamp wins.
 * - If an entry is disqualified after voting starts, remove it from final scoring,
 *   compress affected ranks, and recompute totals.
 *
 * Gaps: The existing integration tests verify disqualification exclusion and basic
 * ballot compression. Missing route-level coverage for:
 * - A tie-break scenario where the disqualified entry's removal changes which
 *   participant wins (rank-count redistribution causes a new winner).
 * - Explicit route-level assertion of tie-break winner order in a tied-points scenario.
 *
 * These tests are marked as TODO pending a follow-up implementation ticket.
 * Tracked under: AUX-68
 *
 * Run with: npm run test:integration
 */

import { describe, it } from "vitest";

// ============================================================================
// Tie-break correctness at finalization
// ============================================================================

describe("POST /api/lifecycle/transition (finalized) — tie-break correctness (AUX-68 spec gaps)", () => {
  it.todo(
    "resolves a tie by first-rank vote count when two participants have equal total points",
  );

  it.todo(
    "resolves a tie by submission timestamp when first-rank counts are also equal",
  );
});

// ============================================================================
// Disqualification recomputation shifting the tie-break winner
// ============================================================================

describe("POST /api/lifecycle/transition (finalized) — disqualification shifts tie-break winner (AUX-68 spec gaps)", () => {
  it.todo(
    "recomputes standings with correct tie-break when the disqualified entry held the most first-rank votes, causing a redistribution that changes the winning participant",
  );

  it.todo(
    "assigns the correct winner after ballot rank compression removes a disqualified entry that previously separated two tied participants",
  );
});
