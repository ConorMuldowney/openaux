import { createHash } from "crypto";
import { ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedEmailRequiredResponse } from "@/src/api/route-handler";
import { createShowcase, createUser } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

const testPrisma = getTestPrisma();

vi.mock("@/src/db/prisma", () => ({
  prisma: testPrisma,
}));

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { POST } from "@/app/api/invites/issue/route";

afterEach(async () => {
  await cleanTestDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("invite issue route integration", () => {
  it("rejects requests from users without verified email", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: false,
      response: verifiedEmailRequiredResponse(
        "You must verify your email address before performing this action.",
      ),
    } as never);

    const hostUser = createUser({ name: "Host User" });
    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.CREATION,
    });

    const response = await POST(
      new Request("http://localhost/api/invites/issue", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
          scope: "participation",
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

    const invites = await testPrisma.invite.findMany({ where: { showcaseId: showcase.id } });
    expect(invites).toHaveLength(0);
  });

  it("rejects invite issue when requester is not the showcase host", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "user-non-host",
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
      new Request("http://localhost/api/invites/issue", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
          scope: "voter",
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

    const invites = await testPrisma.invite.findMany({ where: { showcaseId: showcase.id } });
    expect(invites).toHaveLength(0);
  });

  it("rejects invite issue for finalized showcase", async () => {
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
      lifecycleState: ShowcaseLifecycleState.FINALIZED,
    });

    const response = await POST(
      new Request("http://localhost/api/invites/issue", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
          scope: "listener",
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
        message: "Cannot issue invites for finalized showcases.",
      },
    });

    const invites = await testPrisma.invite.findMany({ where: { showcaseId: showcase.id } });
    expect(invites).toHaveLength(0);
  });

  it("rejects invite issue when expiry is in the past", async () => {
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

    const response = await POST(
      new Request("http://localhost/api/invites/issue", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
          scope: "participation",
          expiresAt: new Date(Date.now() - 60_000).toISOString(),
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
        message: "Invite expiry must be in the future.",
      },
    });

    const invites = await testPrisma.invite.findMany({ where: { showcaseId: showcase.id } });
    expect(invites).toHaveLength(0);
  });

  it("returns plaintext token once while persisting only token hash", async () => {
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

    const response = await POST(
      new Request("http://localhost/api/invites/issue", {
        method: "POST",
        body: JSON.stringify({
          showcaseId: showcase.id,
          scope: "participation",
          invitedEmail: "participant@openaux.test",
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }),
      }),
    );

    expect(response.status).toBe(200);

    const json = (await response.json()) as {
      ok: true;
      data: {
        inviteId: string;
        showcaseId: string;
        scope: "participation" | "listener" | "voter";
        token: string;
      };
    };

    expect(json.ok).toBe(true);
    expect(json.data.showcaseId).toBe(showcase.id);
    expect(json.data.scope).toBe("participation");
    expect(json.data.token).toMatch(/^[a-f0-9]{48}$/);

    const storedInvite = await testPrisma.invite.findUnique({
      where: { id: json.data.inviteId },
      select: {
        id: true,
        showcaseId: true,
        scope: true,
        tokenHash: true,
        invitedByUserId: true,
        invitedEmail: true,
      },
    });

    expect(storedInvite).toBeTruthy();
    expect(storedInvite?.showcaseId).toBe(showcase.id);
    expect(storedInvite?.invitedByUserId).toBe(hostUser.id);
    expect(storedInvite?.invitedEmail).toBe("participant@openaux.test");
    expect(storedInvite?.tokenHash).not.toBe(json.data.token);

    const expectedHash = createHash("sha256").update(json.data.token).digest("hex");
    expect(storedInvite?.tokenHash).toBe(expectedHash);
  });
});
