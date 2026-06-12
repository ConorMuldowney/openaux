import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

vi.mock("@/src/db/prisma", () => ({
  prisma: {
    showcase: {
      findUnique: vi.fn(),
    },
    ballot: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    ballotVersion: {
      create: vi.fn(),
    },
  },
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import { POST } from "@/app/api/ballots/submit/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/ballots/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/ballots/submit contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "voter-1",
          email_verified: true,
        },
      },
    } as never);
  });

  it("returns success envelope for a valid request", async () => {
    vi.mocked(prisma.showcase.findUnique).mockResolvedValue({
      lifecycleState: "VOTING_OPEN",
      voterScope: "PUBLIC",
      votingOpensAt: null,
      votingClosesAt: null,
      maxRankedPicks: 3,
      participants: [],
      invites: [],
    } as never);

    vi.mocked(prisma.ballot.findUnique).mockResolvedValue(null as never);
    vi.mocked(prisma.ballot.create).mockResolvedValue({
      id: "ballot-1",
      versions: [],
    } as never);
    vi.mocked(prisma.ballotVersion.create).mockResolvedValue({
      id: "version-1",
    } as never);
    vi.mocked(prisma.ballot.update).mockResolvedValue({ id: "ballot-1" } as never);

    const response = await POST(
      makeRequest({
        showcaseId: "showcase-1",
        rankedBallot: {
          voterId: "voter-1",
          picks: [
            { rank: 1, participantId: "participant-1" },
            { rank: 2, participantId: "participant-2" },
          ],
        },
      }),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: true,
      data: {
        ballotId: "ballot-1",
        versionNumber: 1,
      },
    });
  });

  it("returns 400 validation-error for invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/ballots/submit", {
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
      },
    });
    expect(body.error.details.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "body", issueCode: "custom" }),
      ]),
    );
  });

  it("returns 409 state-invalid when showcase does not exist", async () => {
    vi.mocked(prisma.showcase.findUnique).mockResolvedValue(null as never);

    const response = await POST(
      makeRequest({
        showcaseId: "showcase-1",
        rankedBallot: {
          voterId: "voter-1",
          picks: [{ rank: 1, participantId: "participant-1" }],
        },
      }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
      },
    });
  });

  it("returns 403 policy-denied for participants attempting to vote", async () => {
    vi.mocked(prisma.showcase.findUnique).mockResolvedValue({
      lifecycleState: "VOTING_OPEN",
      voterScope: "PUBLIC",
      votingOpensAt: null,
      votingClosesAt: null,
      maxRankedPicks: 3,
      participants: [{ id: "participant-1" }],
      invites: [],
    } as never);

    const response = await POST(
      makeRequest({
        showcaseId: "showcase-1",
        rankedBallot: {
          voterId: "voter-1",
          picks: [{ rank: 1, participantId: "participant-2" }],
        },
      }),
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "policy-denied",
        details: {
          policyDenialReason: "participant-cannot-vote",
        },
      },
    });
  });

  it("returns 400 validation-error when ranked ballot domain validation fails", async () => {
    vi.mocked(prisma.showcase.findUnique).mockResolvedValue({
      lifecycleState: "VOTING_OPEN",
      voterScope: "PUBLIC",
      votingOpensAt: null,
      votingClosesAt: null,
      maxRankedPicks: 1,
      participants: [],
      invites: [],
    } as never);

    const response = await POST(
      makeRequest({
        showcaseId: "showcase-1",
        rankedBallot: {
          voterId: "voter-1",
          picks: [
            { rank: 1, participantId: "participant-1" },
            { rank: 2, participantId: "participant-2" },
          ],
        },
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
        expect.objectContaining({ path: "rankedBallot", issueCode: "custom" }),
      ]),
    );
  });
});
