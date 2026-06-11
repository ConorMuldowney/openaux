import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/visibility/voting-results/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/visibility/voting-results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Request validation
// ============================================================================

describe("POST /api/visibility/voting-results — request validation", () => {
  it("returns 400 when lifecycleState is missing", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when lifecycleState is not a valid enum value", async () => {
    const response = await POST(makeRequest({ lifecycleState: "unknown-state" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });
});

// ============================================================================
// Voting results hidden during active phases
// ============================================================================

describe("POST /api/visibility/voting-results — results hidden before finalization", () => {
  it.each([
    ["creation" as const],
    ["submission-open" as const],
    ["voting-open" as const],
  ])("hides voting results in %s state", async (state) => {
    const response = await POST(makeRequest({ lifecycleState: state }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.shouldRevealVotingResults).toBe(false);
  });
});

// ============================================================================
// Voting results revealed after finalization
// ============================================================================

describe("POST /api/visibility/voting-results — results revealed after finalization", () => {
  it("reveals voting results when showcase is finalized", async () => {
    const response = await POST(makeRequest({ lifecycleState: "finalized" }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.shouldRevealVotingResults).toBe(true);
  });
});

