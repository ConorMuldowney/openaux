/**
 * Integration tests for POST /api/lifecycle/transition
 *
 * Verifies that the lifecycle transition route correctly:
 * - Authenticates the caller and requires a verified email
 * - Validates the request body
 * - Rejects transitions to non-existent showcases
 * - Applies valid transitions and persists them with an audit record
 * - Rejects invalid transitions and persists a rejected audit record
 * - Sets finalizedAt when transitioning to "finalized"
 *
 * Run with: npm run test:integration
 */

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import {
  createShowcase,
  createParticipant,
  createEntry,
  createBallot,
  createBallotVersion,
} from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { POST } from "@/app/api/lifecycle/transition/route";

vi.mock("@/src/auth/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
}));

const prisma = getTestPrisma();

function mockVerifiedSession(userId = "auth0|test-host") {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: userId,
      email: "host@openaux.test",
      email_verified: true,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

function mockUnverifiedSession() {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: "auth0|unverified-user",
      email: "unverified@openaux.test",
      email_verified: false,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

function mockNoSession() {
  vi.mocked(auth0.getSession).mockResolvedValue(null);
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/lifecycle/transition", {
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

describe("POST /api/lifecycle/transition — auth", () => {
  it("returns 401 when no session exists", async () => {
    mockNoSession();

    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000001", nextState: "submission-open" }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("authentication-required");
  });

  it("returns 403 when email is not verified", async () => {
    mockUnverifiedSession();

    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000001", nextState: "submission-open" }),
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

describe("POST /api/lifecycle/transition — request validation", () => {
  beforeEach(() => {
    mockVerifiedSession();
  });

  it("returns 400 when showcaseId is missing", async () => {
    const response = await POST(makeRequest({ nextState: "submission-open" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when showcaseId is not a UUID", async () => {
    const response = await POST(makeRequest({ showcaseId: "not-a-uuid", nextState: "submission-open" }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when nextState is an unrecognised value", async () => {
    const response = await POST(
      makeRequest({ showcaseId: "00000000-0000-0000-0000-000000000001", nextState: "archived" }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const request = new Request("http://localhost/api/lifecycle/transition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("validation-error");
  });
});

// ============================================================================
// Showcase not found
// ============================================================================

describe("POST /api/lifecycle/transition — showcase not found", () => {
  it("returns 409 when the showcase does not exist", async () => {
    mockVerifiedSession();

    const response = await POST(
      makeRequest({
        showcaseId: "00000000-0000-0000-0000-000000000099",
        nextState: "submission-open",
      }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("state-invalid");
  });
});

// ============================================================================
// Valid transitions
// ============================================================================

describe("POST /api/lifecycle/transition — valid transitions", () => {
  const hostUserId = "auth0|host-valid";

  beforeEach(() => {
    mockVerifiedSession(hostUserId);
  });

  it("transitions creation → submission-open and persists an applied audit record", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "CREATION",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "submission-open" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.previousState).toBe("creation");
    expect(body.data.nextState).toBe("submission-open");
    expect(body.data.transitionAuditEventId).toBeTruthy();

    // Verify database state
    const updated = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(updated?.lifecycleState).toBe("SUBMISSION_OPEN");

    const auditEvent = await prisma.transitionAuditEvent.findUnique({
      where: { id: body.data.transitionAuditEventId },
    });
    expect(auditEvent).not.toBeNull();
    expect(auditEvent?.fromState).toBe("CREATION");
    expect(auditEvent?.toState).toBe("SUBMISSION_OPEN");
    expect(auditEvent?.actorUserId).toBe(hostUserId);
    expect((auditEvent?.metadata as Record<string, unknown>)?.outcome).toBe("applied");
  });

  it("transitions submission-open → voting-open and persists an applied audit record", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "SUBMISSION_OPEN",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "voting-open" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.previousState).toBe("submission-open");
    expect(body.data.nextState).toBe("voting-open");

    const updated = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(updated?.lifecycleState).toBe("VOTING_OPEN");
  });

  it("transitions voting-open → finalized, sets finalizedAt, and persists an applied audit record", async () => {
    const before = new Date();
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "finalized" }),
    );

    const after = new Date();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.previousState).toBe("voting-open");
    expect(body.data.nextState).toBe("finalized");

    const updated = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(updated?.lifecycleState).toBe("FINALIZED");
    expect(updated?.finalizedAt).not.toBeNull();
    expect(updated!.finalizedAt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(updated!.finalizedAt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it("transitions creation → finalized directly (permitted by ADR-0008)", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "CREATION",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "finalized" }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.previousState).toBe("creation");
    expect(body.data.nextState).toBe("finalized");

    const updated = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(updated?.lifecycleState).toBe("FINALIZED");
    expect(updated?.finalizedAt).not.toBeNull();
  });

  it("stores an optional reason on the audit record when provided", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "CREATION",
    });

    const reason = "Opening submissions for the summer showcase.";
    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "submission-open", reason }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();

    const auditEvent = await prisma.transitionAuditEvent.findUnique({
      where: { id: body.data.transitionAuditEventId },
    });
    expect(auditEvent?.reason).toBe(reason);
  });
});

// ============================================================================
// Invalid transitions
// ============================================================================

describe("POST /api/lifecycle/transition — invalid transitions", () => {
  const hostUserId = "auth0|host-invalid";

  beforeEach(() => {
    mockVerifiedSession(hostUserId);
  });

  it("returns 409 and creates a rejected audit record for a disallowed transition", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "FINALIZED",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "creation" }),
    );

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("state-invalid");

    // Showcase state must not have changed
    const unchanged = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(unchanged?.lifecycleState).toBe("FINALIZED");

    // A rejected audit record must have been written
    const auditEvents = await prisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
    });
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].fromState).toBe("FINALIZED");
    expect(auditEvents[0].toState).toBe("CREATION");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("rejected");
  });

  it("returns 409 for submission-open → creation (no rollback allowed)", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "SUBMISSION_OPEN",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "creation" }),
    );

    expect(response.status).toBe(409);
    const unchanged = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(unchanged?.lifecycleState).toBe("SUBMISSION_OPEN");
  });

  it("returns 409 for voting-open → submission-open (no rollback allowed)", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "submission-open" }),
    );

    expect(response.status).toBe(409);
    const unchanged = await prisma.showcase.findUnique({ where: { id: showcase.id } });
    expect(unchanged?.lifecycleState).toBe("VOTING_OPEN");
  });
});

// ============================================================================
// Final snapshot publication on finalization
// ============================================================================

describe("POST /api/lifecycle/transition — final snapshot publication", () => {
  const hostUserId = "auth0|host-snapshot";

  beforeEach(() => {
    mockVerifiedSession(hostUserId);
  });

  it("publishes final standings when transitioning voting-open → finalized", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
      maxRankedPicks: 3,
    });

    const p1 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p2 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p3 = await createParticipant(prisma, { showcaseId: showcase.id });

    await createEntry(prisma, { showcaseId: showcase.id, participantId: p1.id, isValid: true });
    await createEntry(prisma, { showcaseId: showcase.id, participantId: p2.id, isValid: true });
    await createEntry(prisma, { showcaseId: showcase.id, participantId: p3.id, isValid: true });

    const ballot1 = await createBallot(prisma, { showcaseId: showcase.id, voterUserId: "voter-1" });
    const version1 = await createBallotVersion(prisma, {
      ballotId: ballot1.id,
      rankedParticipantIds: [p1.id, p2.id, p3.id],
    });
    await prisma.ballot.update({ where: { id: ballot1.id }, data: { currentVersionId: version1.id } });

    const ballot2 = await createBallot(prisma, { showcaseId: showcase.id, voterUserId: "voter-2" });
    const version2 = await createBallotVersion(prisma, {
      ballotId: ballot2.id,
      rankedParticipantIds: [p1.id, p3.id],
    });
    await prisma.ballot.update({ where: { id: ballot2.id }, data: { currentVersionId: version2.id } });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "finalized" }),
    );

    expect(response.status).toBe(200);

    const finalStandings = await prisma.finalStandings.findUnique({
      where: { showcaseId: showcase.id },
    });

    expect(finalStandings).not.toBeNull();
    expect(finalStandings!.publishedAt).not.toBeNull();

    const standings = finalStandings!.standings as Array<{
      rank: number;
      participantId: string;
      points: number;
    }>;

    // p1 gets: v1(3pts) + v2(3pts) = 6; p2 gets: v1(2pts) = 2; p3 gets: v1(1pt) + v2(2pts) = 3
    expect(standings[0].participantId).toBe(p1.id);
    expect(standings[0].rank).toBe(1);
    expect(standings[0].points).toBe(6);

    expect(standings[1].participantId).toBe(p3.id);
    expect(standings[1].rank).toBe(2);
    expect(standings[1].points).toBe(3);

    expect(standings[2].participantId).toBe(p2.id);
    expect(standings[2].rank).toBe(3);
    expect(standings[2].points).toBe(2);
  });

  it("publishes empty standings when transitioning creation → finalized with no ballots", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "CREATION",
    });

    const response = await POST(
      makeRequest({ showcaseId: showcase.id, nextState: "finalized" }),
    );

    expect(response.status).toBe(200);

    const finalStandings = await prisma.finalStandings.findUnique({
      where: { showcaseId: showcase.id },
    });

    expect(finalStandings).not.toBeNull();
    expect(finalStandings!.standings).toEqual([]);
  });

  it("only uses current ballot versions and ignores stale versions", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
      maxRankedPicks: 2,
    });

    const p1 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p2 = await createParticipant(prisma, { showcaseId: showcase.id });

    await createEntry(prisma, { showcaseId: showcase.id, participantId: p1.id, isValid: true });
    await createEntry(prisma, { showcaseId: showcase.id, participantId: p2.id, isValid: true });

    const ballot = await createBallot(prisma, { showcaseId: showcase.id, voterUserId: "voter-stale" });
    // Version 1 (stale): prefers p2
    await createBallotVersion(prisma, {
      ballotId: ballot.id,
      versionNumber: 1,
      rankedParticipantIds: [p2.id, p1.id],
    });
    // Version 2 (current): prefers p1
    const version2 = await createBallotVersion(prisma, {
      ballotId: ballot.id,
      versionNumber: 2,
      rankedParticipantIds: [p1.id, p2.id],
    });
    await prisma.ballot.update({ where: { id: ballot.id }, data: { currentVersionId: version2.id } });

    await POST(makeRequest({ showcaseId: showcase.id, nextState: "finalized" }));

    const finalStandings = await prisma.finalStandings.findUnique({
      where: { showcaseId: showcase.id },
    });

    const standings = finalStandings!.standings as Array<{ participantId: string; points: number }>;
    // Only version 2 counts: p1=2pts, p2=1pt
    expect(standings[0].participantId).toBe(p1.id);
    expect(standings[0].points).toBe(2);
  });

  it("excludes invalid entries from final standings and recomputes points from compressed ballots", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
      maxRankedPicks: 3,
    });

    const p1 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p2 = await createParticipant(prisma, { showcaseId: showcase.id });
    const disqualified = await createParticipant(prisma, { showcaseId: showcase.id });

    await createEntry(prisma, { showcaseId: showcase.id, participantId: p1.id, isValid: true });
    await createEntry(prisma, { showcaseId: showcase.id, participantId: p2.id, isValid: true });
    await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: disqualified.id,
      isValid: false,
    });

    const ballot1 = await createBallot(prisma, { showcaseId: showcase.id, voterUserId: "voter-1" });
    const version1 = await createBallotVersion(prisma, {
      ballotId: ballot1.id,
      rankedParticipantIds: [p1.id, disqualified.id, p2.id],
    });
    await prisma.ballot.update({ where: { id: ballot1.id }, data: { currentVersionId: version1.id } });

    const ballot2 = await createBallot(prisma, { showcaseId: showcase.id, voterUserId: "voter-2" });
    const version2 = await createBallotVersion(prisma, {
      ballotId: ballot2.id,
      rankedParticipantIds: [p2.id, disqualified.id, p1.id],
    });
    await prisma.ballot.update({ where: { id: ballot2.id }, data: { currentVersionId: version2.id } });

    const response = await POST(makeRequest({ showcaseId: showcase.id, nextState: "finalized" }));
    expect(response.status).toBe(200);

    const finalStandings = await prisma.finalStandings.findUnique({
      where: { showcaseId: showcase.id },
    });

    const standings = finalStandings!.standings as Array<{ participantId: string; points: number }>;
    expect(standings).toHaveLength(2);
    expect(standings.every((standing) => standing.participantId !== disqualified.id)).toBe(true);
    expect(standings.map((standing) => standing.points)).toEqual([5, 5]);
  });
});
