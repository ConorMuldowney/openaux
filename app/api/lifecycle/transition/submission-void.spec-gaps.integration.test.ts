/**
 * Spec-gap tests for submission-close void enforcement at the lifecycle transition route.
 *
 * PRD rule (ADR-0005): "If fewer than two valid entries exist at submission close,
 * the showcase is void and does not proceed to voting."
 *
 * Current gap: POST /api/lifecycle/transition does not enforce the void condition
 * when transitioning from submission-open → voting-open. The transition succeeds
 * regardless of valid entry count.
 *
 * These tests are marked as TODO pending a follow-up implementation ticket.
 * Tracked under: AUX-68
 *
 * Run with: npm run test:integration
 */

import { describe, it } from "vitest";

// ============================================================================
// Void enforcement — submission-open → voting-open
// ============================================================================

describe("POST /api/lifecycle/transition — submission-close void enforcement (AUX-68 spec gaps)", () => {
  it.todo(
    "rejects submission-open → voting-open transition when zero valid entries exist at submission close",
  );

  it.todo(
    "rejects submission-open → voting-open transition when exactly one valid entry exists at submission close",
  );

  it.todo(
    "permits submission-open → voting-open transition when exactly two valid entries exist at submission close",
  );

  it.todo(
    "permits submission-open → voting-open transition when three or more valid entries exist at submission close",
  );

  it.todo(
    "counts only valid entries (isValid: true) when evaluating the void threshold at submission close",
  );
});
