import { createHash, randomUUID } from "crypto";
import { InviteAcceptanceOutcome, InviteScope } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import { createShowcase } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { POST } from "@/app/api/invites/accept/route";

vi.mock("@/src/auth/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
}));

const prisma = getTestPrisma();

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function mockVerifiedSession(userId = "auth0|invite-accept-user") {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: userId,
      email: "invitee@openaux.test",
      email_verified: true,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

function mockNoSession() {
  vi.mocked(auth0.getSession).mockResolvedValue(null);
}

function makeRequest(token: string) {
  return new Request("http://localhost/api/invites/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}

afterEach(async () => {
  await cleanTestDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/invites/accept - auth", () => {
  it("returns 401 when no session exists", async () => {
    mockNoSession();

    const response = await POST(makeRequest("missing-session-token"));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("authentication-required");
  });
});

describe("POST /api/invites/accept - integration", () => {
  const hostUserId = "auth0|invite-host";
  const actorUserId = "auth0|invite-actor";

  beforeEach(() => {
    mockVerifiedSession(actorUserId);
  });

  it("accepts a valid invite and writes an accepted audit record", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "SUBMISSION_OPEN",
    });

    const token = `accept-${randomUUID()}`;
    const invite = await prisma.invite.create({
      data: {
        showcaseId: showcase.id,
        scope: InviteScope.PARTICIPATION,
        tokenHash: hashToken(token),
        invitedByUserId: hostUserId,
      },
    });

    const response = await POST(makeRequest(token));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data.inviteId).toBe(invite.id);
    expect(body.data.acceptedByUserId).toBe(actorUserId);
    expect(body.data.scope).toBe("participation");
    expect(body.data.resolution).toBe("accepted");

    const persistedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(persistedInvite?.acceptedByUserId).toBe(actorUserId);
    expect(persistedInvite?.acceptedAt).not.toBeNull();

    const auditRecords = await prisma.inviteAcceptanceAuditEvent.findMany({
      where: { inviteId: invite.id },
    });
    expect(auditRecords).toHaveLength(1);
    expect(auditRecords[0].outcome).toBe(InviteAcceptanceOutcome.ACCEPTED);
    expect(auditRecords[0].reason).toBeNull();
  });

  it("returns read-only resolution after finalization and writes a rejected audit record", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "FINALIZED",
    });

    const token = `finalized-${randomUUID()}`;
    const invite = await prisma.invite.create({
      data: {
        showcaseId: showcase.id,
        scope: InviteScope.LISTENER,
        tokenHash: hashToken(token),
        invitedByUserId: hostUserId,
      },
    });

    const response = await POST(makeRequest(token));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      inviteId: invite.id,
      showcaseId: showcase.id,
      scope: "listener",
      resolution: "read-only-after-finalization",
      acceptedByUserId: null,
      acceptedAt: null,
    });

    const persistedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(persistedInvite?.acceptedAt).toBeNull();
    expect(persistedInvite?.acceptedByUserId).toBeNull();

    const auditRecords = await prisma.inviteAcceptanceAuditEvent.findMany({
      where: { inviteId: invite.id },
    });
    expect(auditRecords).toHaveLength(1);
    expect(auditRecords[0].outcome).toBe(InviteAcceptanceOutcome.REJECTED);
    expect(auditRecords[0].reason).toBe("invite-read-only-after-finalization");
  });

  it("permits only one success across simultaneous acceptance attempts", async () => {
    const showcase = await createShowcase(prisma, {
      hostUserId,
      lifecycleState: "VOTING_OPEN",
    });

    const token = `race-${randomUUID()}`;
    const invite = await prisma.invite.create({
      data: {
        showcaseId: showcase.id,
        scope: InviteScope.VOTER,
        tokenHash: hashToken(token),
        invitedByUserId: hostUserId,
      },
    });

    const attempts = 6;
    const responses = await Promise.all(
      Array.from({ length: attempts }, async () => {
        const response = await POST(makeRequest(token));
        const body = await response.json();
        return { status: response.status, body };
      }),
    );

    const succeeded = responses.filter((result) => result.status === 200);
    const rejected = responses.filter((result) => result.status === 409);

    expect(succeeded).toHaveLength(1);
    expect(rejected).toHaveLength(attempts - 1);

    const persistedInvite = await prisma.invite.findUnique({ where: { id: invite.id } });
    expect(persistedInvite?.acceptedByUserId).toBe(actorUserId);
    expect(persistedInvite?.acceptedAt).not.toBeNull();

    const auditRecords = await prisma.inviteAcceptanceAuditEvent.findMany({
      where: { inviteId: invite.id },
      orderBy: { occurredAt: "asc" },
    });
    expect(auditRecords).toHaveLength(attempts);
    expect(auditRecords.filter((record) => record.outcome === InviteAcceptanceOutcome.ACCEPTED)).toHaveLength(1);

    const rejectedReasons = new Set(
      auditRecords
        .filter((record) => record.outcome === InviteAcceptanceOutcome.REJECTED)
        .map((record) => record.reason),
    );
    for (const reason of rejectedReasons) {
      expect(["invite-race-conflict", "invite-already-accepted", "identity-already-accepted-for-scope"]).toContain(reason);
    }
  });
});