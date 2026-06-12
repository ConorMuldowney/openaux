import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/submissions/required-samples/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/submissions/required-samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/submissions/required-samples contract", () => {
  it("returns success envelope for a valid request", async () => {
    const response = await POST(
      makeRequest({
        participantId: "participant-1",
        showcaseId: "showcase-1",
        requiredSampleIds: ["sample-a", "sample-b"],
        usedSampleIds: ["sample-a", "sample-b", "sample-c"],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: { isEntryValid: true },
    });
  });

  it("returns validation envelope for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/submissions/required-samples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation-error",
        message: "Request validation failed.",
      },
    });
    expect(body.error.details.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "body", issueCode: "custom" }),
      ]),
    );
  });
});
