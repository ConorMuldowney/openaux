/**
 * Integration tests for POST /api/scoring/final-standings
 *
 * Verifies that the final standings route correctly:
 * - Authenticates the caller and requires a verified email
 * - Validates the request body
 * - Rejects requests for non-existent showcases
 * - Rejects requests for showcases that are not yet finalized
 * - Returns the published standings for a finalized showcase
 *
 * Run with: npm run test:integration
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import {
  createShowcase,
  createParticipant,
  createEntry,
} from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { POST } from "@/app/api/scoring/final-standings/route";

vi.mock("@/src/auth/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
}));

const prisma = getTestPrisma();

function mockVerifiedSession(userId = "auth0|test-user") {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: userId,
      email: "user@openaux.test",
      email_verified: true,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

function mockUnverifiedSession() {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: "auth0|unverified",
      email: "unverified@openaux.test",
      email_verified: false,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

function mockNoSession() {
  vi.mocked(auth0.getSession).mockResolvedValue(null);
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/scoring/final-standings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await cleanTestDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ============================================================================
// Auth guards
// ============================================================================

describe("POST /api/scoring/final-standings — auth", () => {
  it("returns 401 when no session exists", async () => {
    mockNoSession();

    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000001" }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("authentication-required");
  });

  it("returns 403 when email is not verified", async () => {
    mockUnverifiedSession();

    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000001" }),
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("verified-email-required");
  });
});

// ============================================================================
// Request validation
// ============================================================================

describe("POST /api/scoring/final-standings — request validation", () => {
  beforeEach(() => {
    mockVerifiedSession();
  });

  it("returns 400 when showcaseId is missing", async () => {
    const response = await POST(makeRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when showcaseId is not a UUID", async () => {
    const response = await POST(makeRequest({ showcaseId: "not-a-uuid" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });
});

// ============================================================================
// Showcase not found
// ============================================================================

describe("POST /api/scoring/final-standings — showcase not found", () => {
  it("returns 409 when the showcase does not exist", async () => {
    mockVerifiedSession();

    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000099" }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("state-invalid");
  });
});

// ============================================================================
// Visibility gate
// ============================================================================

describe("POST /api/scoring/final-standings — voting results visibility gate", () => {
  beforeEach(() => {
    mockVerifiedSession();
  });

  it.each([
    ["CREATION" as const],
    ["SUBMISSION_OPEN" as const],
    ["VOTING_OPEN" as const],
  ])("returns 409 for a showcase in %s state (results not yet revealed)", async (state) => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: state,
    });

    const response = await POST(makeRequest({ showcaseId: showcase.id }));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("state-invalid");
  });
});

// ============================================================================
// Successful retrieval
// ============================================================================

describe("POST /api/scoring/final-standings — successful retrieval", () => {
  beforeEach(() => {
    mockVerifiedSession();
  });

  it("returns the published standings for a finalized showcase", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: "FINALIZED",
      maxRankedPicks: 3,
    });

    const p1 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p2 = await createParticipant(prisma, { showcaseId: showcase.id });

    await createEntry(prisma, { showcaseId: showcase.id, participantId: p1.id });
    await createEntry(prisma, { showcaseId: showcase.id, participantId: p2.id });

    // Manually publish standings to simulate what the lifecycle transition would do
    await prisma.finalStandings.create({
      data: {
        showcaseId: showcase.id,
        standings: [
          { rank: 1, participantId: p1.id, points: 6, rankCounts: [2, 0, 0] },
          { rank: 2, participantId: p2.id, points: 3, rankCounts: [0, 2, 0] },
        ],
      },
    });

    const response = await POST(makeRequest({ showcaseId: showcase.id }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.showcaseId).toBe(showcase.id);
    expect(body.data.publishedAt).toBeTruthy();
    expect(body.data.standings).toHaveLength(2);
    expect(body.data.standings[0].rank).toBe(1);
    expect(body.data.standings[0].participantId).toBe(p1.id);
    expect(body.data.standings[0].points).toBe(6);
    expect(body.data.standings[1].rank).toBe(2);
    expect(body.data.standings[1].participantId).toBe(p2.id);
  });

  it("returns 409 when standings have not been published for a finalized showcase", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: "FINALIZED",
    });

    const response = await POST(makeRequest({ showcaseId: showcase.id }));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("state-invalid");
  });
});
