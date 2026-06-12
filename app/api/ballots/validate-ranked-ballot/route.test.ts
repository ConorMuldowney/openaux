import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { POST } from "@/app/api/ballots/validate-ranked-ballot/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ballots/validate-ranked-ballot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ballots/validate-ranked-ballot contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "user-1",
          email_verified: true,
        },
      },
    } as never);
  });

  it("returns success envelope for a valid request", async () => {
    const response = await POST(
      makeRequest({
        rankedBallot: {
          voterId: "voter-1",
          picks: [{ rank: 1, participantId: "participant-1" }],
        },
        maxRankedPicks: 3,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: {
        isValid: true,
      },
    });
  });

  it("returns validation envelope for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/ballots/validate-ranked-ballot", {
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
