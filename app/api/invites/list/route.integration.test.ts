import { InviteScope, ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedEmailRequiredResponse } from "@/src/api/route-handler";
import { createInvite, createShowcase, createUser } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

const testPrisma = getTestPrisma();

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { POST } from "@/app/api/invites/list/route";

afterEach(async () => {
  await cleanTestDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("invite list route integration", () => {
  it("rejects requests from users without verified email", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: false,
      response: verifiedEmailRequiredResponse(
        "You must verify your email address before performing this action.",
      ),
    } as never);

    const response = await POST(
      new Request("http://localhost/api/invites/list", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: "85cf756f-fbb1-4988-b27f-52b352f45f84",
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "verified-email-required",
      },
    });
  });

  it("rejects list requests when requester is not the showcase host", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "auth0|not-host",
          email_verified: true,
        },
      },
    } as never);

    const hostUser = createUser({ name: "Host User" });
    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.CREATION,
    });

    const response = await POST(
      new Request("http://localhost/api/invites/list", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
        }),
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "policy-denied",
        details: {
          policyDenialReason: "host-membership-required",
        },
      },
    });
  });

  it("lists invites for the host ordered by newest first", async () => {
    const hostUser = createUser({ name: "Host User" });
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: hostUser.id,
          email_verified: true,
        },
      },
    } as never);

    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.CREATION,
    });

    const olderInvite = await createInvite(testPrisma, {
      showcaseId: showcase.id,
      scope: InviteScope.PARTICIPATION,
      invitedByUserId: hostUser.id,
      invitedEmail: "participant1@openaux.test",
      expiresAt: new Date("2026-12-01T10:00:00.000Z"),
      acceptedByUserId: "auth0|participant-1",
      acceptedAt: new Date("2026-11-01T10:00:00.000Z"),
    });

    await createInvite(testPrisma, {
      showcaseId: showcase.id,
      scope: InviteScope.VOTER,
      invitedByUserId: hostUser.id,
      invitedEmail: "voter1@openaux.test",
      revokedAt: new Date("2026-11-20T10:00:00.000Z"),
    });

    const response = await POST(
      new Request("http://localhost/api/invites/list", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
        }),
      }),
    );

    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: true;
      data: {
        showcaseId: string;
        invites: Array<{
          inviteId: string;
          scope: "participation" | "listener" | "voter";
          invitedEmail: string | null;
          acceptedByUserId: string | null;
          acceptedAt: string | null;
          expiresAt: string | null;
          revokedAt: string | null;
          createdAt: string;
        }>;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.showcaseId).toBe(showcase.id);
    expect(body.data.invites).toHaveLength(2);

    expect(body.data.invites[0].inviteId).not.toBe(olderInvite.id);
    expect(body.data.invites[0].scope).toBe("voter");
    expect(body.data.invites[0].revokedAt).toBe("2026-11-20T10:00:00.000Z");

    expect(body.data.invites[1]).toMatchObject({
      inviteId: olderInvite.id,
      scope: "participation",
      invitedEmail: "participant1@openaux.test",
      acceptedByUserId: "auth0|participant-1",
      acceptedAt: "2026-11-01T10:00:00.000Z",
      expiresAt: "2026-12-01T10:00:00.000Z",
      revokedAt: null,
    });

    expect(body.data.invites[1]).not.toHaveProperty("tokenHash");
  });
});