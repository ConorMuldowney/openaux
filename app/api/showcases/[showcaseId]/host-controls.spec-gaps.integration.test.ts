/**
 * Spec-gap tests for host cancel and deadline extension window constraints
 * at the showcase update route (PATCH /api/showcases/[showcaseId]).
 *
 * PRD rules (ADR-0008):
 * - Host can cancel only before voting opens.
 * - Submission close may be extended only while submissions are open and before voting starts.
 * - Voting close may be extended only while voting is open.
 *
 * Gaps: The existing tests cover the most common allow/deny paths but are missing
 * explicit coverage for several boundary states and directional constraints.
 *
 * These tests are marked as TODO pending a follow-up implementation ticket.
 * Tracked under: AUX-68
 *
 * Run with: npm run test:integration
 */

import { describe, it } from "vitest";

// ============================================================================
// Host cancel window
// ============================================================================

describe("PATCH /api/showcases/[showcaseId] — cancel-showcase window (AUX-68 spec gaps)", () => {
  it.todo(
    "allows cancel-showcase from creation state (host can cancel before any submissions open)",
  );

  it.todo(
    "denies cancel-showcase for a finalized showcase",
  );
});

// ============================================================================
// Extend submission close
// ============================================================================

describe("PATCH /api/showcases/[showcaseId] — extend-submission-close window (AUX-68 spec gaps)", () => {
  it.todo(
    "denies extend-submission-close when showcase is in creation state",
  );

  it.todo(
    "denies extend-submission-close when showcase is in voting-open state",
  );

  it.todo(
    "denies extend-submission-close when showcase is finalized",
  );

  it.todo(
    "denies extend-submission-close when new deadline is not later than the current submission close (backward extension)",
  );

  it.todo(
    "denies extend-submission-close when new deadline equals the current submission close (no change)",
  );
});

// ============================================================================
// Extend voting close
// ============================================================================

describe("PATCH /api/showcases/[showcaseId] — extend-voting-close window (AUX-68 spec gaps)", () => {
  it.todo(
    "denies extend-voting-close when showcase is in submission-open state",
  );

  it.todo(
    "denies extend-voting-close when showcase is in creation state",
  );

  it.todo(
    "denies extend-voting-close when showcase is finalized",
  );

  it.todo(
    "denies extend-voting-close when new deadline is not later than the current voting close (backward extension)",
  );

  it.todo(
    "denies extend-voting-close when new deadline equals the current voting close (no change)",
  );
});
