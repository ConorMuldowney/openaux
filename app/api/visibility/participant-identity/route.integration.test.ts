/**
 * Integration tests for POST /api/visibility/participant-identity
 *
 * Verifies blind-judging reveal behaviour across all lifecycle states.
 *
 * Run with: npm run test:integration
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/visibility/participant-identity/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/visibility/participant-identity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Request validation
// ============================================================================

describe("POST /api/visibility/participant-identity — request validation", () => {
  it("returns 400 when isBlindJudgingEnabled is missing", async () => {
    const response = await POST(makeRequest({ lifecycleState: "voting-open" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when lifecycleState is missing", async () => {
    const response = await POST(makeRequest({ isBlindJudgingEnabled: true }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when lifecycleState is not a valid enum value", async () => {
    const response = await POST(
      makeRequest({ isBlindJudgingEnabled: true, lifecycleState: "archived" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when isBlindJudgingEnabled is not a boolean", async () => {
    const response = await POST(
      makeRequest({ isBlindJudgingEnabled: 1, lifecycleState: "voting-open" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/visibility/participant-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });
});

// ============================================================================
// Blind judging disabled — identity always revealed
// ============================================================================

describe("POST /api/visibility/participant-identity — blind judging disabled", () => {
  it.each([
    ["creation" as const],
    ["submission-open" as const],
    ["voting-open" as const],
    ["finalized" as const],
  ])(
    "reveals participant identity in '%s' state when blind judging is disabled",
    async (lifecycleState) => {
      const response = await POST(
        makeRequest({ isBlindJudgingEnabled: false, lifecycleState }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        ok: true,
        data: { shouldRevealParticipantIdentity: true },
      });
    },
  );
});

// ============================================================================
// Blind judging enabled — identity hidden until finalized
// ============================================================================

describe("POST /api/visibility/participant-identity — blind judging enabled", () => {
  it.each([
    ["creation" as const],
    ["submission-open" as const],
    ["voting-open" as const],
  ])(
    "hides participant identity in '%s' state when blind judging is enabled",
    async (lifecycleState) => {
      const response = await POST(
        makeRequest({ isBlindJudgingEnabled: true, lifecycleState }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toMatchObject({
        ok: true,
        data: { shouldRevealParticipantIdentity: false },
      });
    },
  );

  it("reveals participant identity in 'finalized' state when blind judging is enabled", async () => {
    const response = await POST(
      makeRequest({ isBlindJudgingEnabled: true, lifecycleState: "finalized" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: { shouldRevealParticipantIdentity: true },
    });
  });
});

// ============================================================================
// Response shape
// ============================================================================

describe("POST /api/visibility/participant-identity — response shape", () => {
  it("returns a well-formed success envelope", async () => {
    const response = await POST(
      makeRequest({ isBlindJudgingEnabled: false, lifecycleState: "creation" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: {
        shouldRevealParticipantIdentity: expect.any(Boolean),
      },
    });
  });
});
