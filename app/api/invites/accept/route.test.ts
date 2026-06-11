import { InviteScope, ShowcaseLifecycleState } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/api/auth", () => ({
  requireAuthenticatedSession: vi.fn(),
}));

vi.mock("@/src/db/prisma", () => ({
  prisma: {
    invite: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    inviteAcceptanceAuditEvent: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { requireAuthenticatedSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import { POST } from "@/app/api/invites/accept/route";

describe("invite accept boundary route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invite acceptance after showcase finalization", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "user-1",
          email_verified: true,
        },
      },
    } as never);

    vi.mocked(prisma.invite.findUnique).mockResolvedValue({
      id: "invite-1",
      showcaseId: "showcase-1",
      scope: InviteScope.PARTICIPATION,
      acceptedByUserId: null,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: null,
      showcase: {
        lifecycleState: ShowcaseLifecycleState.FINALIZED,
      },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
        message: "Invite links are read-only after showcase finalization.",
      },
    });
  });

  it("accepts a valid invite and returns acceptance payload", async () => {
    vi.mocked(requireAuthenticatedSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "user-2",
          email_verified: true,
        },
      },
    } as never);

    vi.mocked(prisma.invite.findUnique).mockResolvedValue({
      id: "9fa7d667-2d71-4ddb-8c16-a75f92ca95f5",
      showcaseId: "761e62fc-70ca-43ea-9492-718584778e40",
      scope: InviteScope.VOTER,
      acceptedByUserId: null,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: null,
      showcase: {
        lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
      },
    } as never);

    vi.mocked(prisma.invite.findFirst).mockResolvedValue(null as never);
    const transactionMock = prisma.$transaction as unknown as {
      mockImplementation: (implementation: (callback: (tx: unknown) => Promise<unknown>) => Promise<unknown>) => void;
    };
    transactionMock.mockImplementation(async (callback) =>
      callback({
        invite: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        inviteAcceptanceAuditEvent: {
          create: vi.fn().mockResolvedValue({ id: "26fdf6d4-8db2-4d03-8f2b-4eb5439f39f9" }),
        },
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token: "token-2" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        inviteId: "9fa7d667-2d71-4ddb-8c16-a75f92ca95f5",
        showcaseId: "761e62fc-70ca-43ea-9492-718584778e40",
        scope: "voter",
        acceptedByUserId: "user-2",
        inviteAcceptanceAuditEventId: "26fdf6d4-8db2-4d03-8f2b-4eb5439f39f9",
      },
    });
  });
});
