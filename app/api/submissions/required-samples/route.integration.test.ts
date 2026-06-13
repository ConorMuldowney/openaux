/**
 * Integration tests for POST /api/submissions/required-samples
 *
 * Verifies required-sample completeness checks:
 * - empty required samples list
 * - full match (all required samples present in used list)
 * - partial match (some required samples missing)
 * - superset (extra used samples beyond required)
 *
 * Run with: npm run test:integration
 */

import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/submissions/required-samples/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/submissions/required-samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const BASE_IDS = {
  participantId: "participant-test-1",
  showcaseId: "showcase-test-1",
};

// ============================================================================
// Request validation
// ============================================================================

describe("POST /api/submissions/required-samples — request validation", () => {
  it("returns 400 when participantId is missing", async () => {
    const response = await POST(
      makeRequest({ showcaseId: BASE_IDS.showcaseId, requiredSampleIds: [], usedSampleIds: [] }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when showcaseId is missing", async () => {
    const response = await POST(
      makeRequest({
        participantId: BASE_IDS.participantId,
        requiredSampleIds: [],
        usedSampleIds: [],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when requiredSampleIds is missing", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        usedSampleIds: ["sample-a"],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when usedSampleIds is missing", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a"],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/submissions/required-samples", {
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
// Empty required samples — always invalid
// ============================================================================

describe("POST /api/submissions/required-samples — empty required samples", () => {
  it("returns isEntryValid: false when requiredSampleIds is empty and usedSampleIds is also empty", async () => {
    const response = await POST(
      makeRequest({ ...BASE_IDS, requiredSampleIds: [], usedSampleIds: [] }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: false } });
  });

  it("returns isEntryValid: false when requiredSampleIds is empty even with used samples present", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: [],
        usedSampleIds: ["sample-a", "sample-b"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: false } });
  });
});

// ============================================================================
// Full match — all required samples used
// ============================================================================

describe("POST /api/submissions/required-samples — full match", () => {
  it("returns isEntryValid: true when all required samples are present in used list", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a", "sample-b", "sample-c"],
        usedSampleIds: ["sample-a", "sample-b", "sample-c"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: true } });
  });

  it("returns isEntryValid: true for a single required sample that is used", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a"],
        usedSampleIds: ["sample-a"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: true } });
  });
});

// ============================================================================
// Superset — extra used samples beyond required
// ============================================================================

describe("POST /api/submissions/required-samples — superset used samples", () => {
  it("returns isEntryValid: true when all required samples are present plus additional used samples", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a", "sample-b"],
        usedSampleIds: ["sample-a", "sample-b", "sample-c", "sample-d"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: true } });
  });
});

// ============================================================================
// Partial match — some required samples missing
// ============================================================================

describe("POST /api/submissions/required-samples — partial match", () => {
  it("returns isEntryValid: false when only some required samples are used", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a", "sample-b", "sample-c"],
        usedSampleIds: ["sample-a", "sample-b"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: false } });
  });

  it("returns isEntryValid: false when none of the required samples are used", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a", "sample-b"],
        usedSampleIds: ["sample-c", "sample-d"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: false } });
  });

  it("returns isEntryValid: false when the single required sample is not used", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-required"],
        usedSampleIds: ["sample-other"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true, data: { isEntryValid: false } });
  });
});

// ============================================================================
// Response shape
// ============================================================================

describe("POST /api/submissions/required-samples — response shape", () => {
  it("returns a well-formed success envelope with isEntryValid as boolean", async () => {
    const response = await POST(
      makeRequest({
        ...BASE_IDS,
        requiredSampleIds: ["sample-a"],
        usedSampleIds: ["sample-a"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: {
        isEntryValid: expect.any(Boolean),
      },
    });
  });
});
