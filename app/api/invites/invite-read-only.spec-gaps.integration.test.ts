/**
 * Spec-gap tests for system-level invite read-only semantics after showcase finalization.
 *
 * PRD rule (ADR-0008):
 * "Invite links remain available as read-only after finalization."
 *
 * This means:
 * - Issuing new invites for a finalized showcase is blocked.           (enforced ✓)
 * - Accepting an invite for a finalized showcase is blocked.           (enforced ✓)
 * - Listing invites for a finalized showcase is allowed (read access). (no test  ←)
 *
 * The third behavior—reading the invite list for historical access after
 * finalization—is implemented (the list route applies no lifecycle gate)
 * but is not explicitly asserted in any test.
 *
 * These tests are marked as TODO pending a follow-up verification ticket.
 * Tracked under: AUX-68
 *
 * Run with: npm run test:integration
 */

import { describe, it } from "vitest";

// ============================================================================
// Invite list — read access on finalized showcase
// ============================================================================

describe("POST /api/invites/list — read-only access after finalization (AUX-68 spec gaps)", () => {
  it.todo(
    "returns the invite list for a finalized showcase (host read access must be preserved after finalization)",
  );

  it.todo(
    "returns invite records in finalized state including accepted and revoked invite metadata",
  );
});

// ============================================================================
// Invite issue — write blocked on finalized showcase
// ============================================================================

describe("POST /api/invites/issue — write blocked after finalization (AUX-68 spec gaps)", () => {
  it.todo(
    "returns 409 state-invalid with a clear message when attempting to issue an invite for a finalized showcase",
  );
});

// ============================================================================
// Invite accept — blocked on finalized showcase
// ============================================================================

describe("POST /api/invites/accept — blocked after finalization (AUX-68 spec gaps)", () => {
  it.todo(
    "returns 409 state-invalid with reason invite-read-only-after-finalization when token belongs to a finalized showcase",
  );

  it.todo(
    "records a rejected acceptance audit entry with reason invite-read-only-after-finalization",
  );
});
