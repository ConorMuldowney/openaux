import { AccessScope, InviteScope, ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import { createInvite, createShowcase } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { GET as listShowcases } from "@/app/api/showcases/list/route";
import { GET as readShowcase } from "@/app/api/showcases/[showcaseId]/read/route";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

vi.mock("@/src/auth/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
}));

const prisma = getTestPrisma();

function mockNoSession() {
  vi.mocked(auth0.getSession).mockResolvedValue(null);
}

function mockSession(userId: string) {
  vi.mocked(auth0.getSession).mockResolvedValue({
    user: {
      sub: userId,
      email: `${userId}@openaux.test`,
      email_verified: true,
    },
  } as Awaited<ReturnType<typeof auth0.getSession>>);
}

afterEach(async () => {
  await cleanTestDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/showcases/list", () => {
  it("lists only public-listener showcases for anonymous callers", async () => {
    mockNoSession();

    await createShowcase(prisma, {
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.CREATION,
      title: "Public Listener Showcase",
    });

    await createShowcase(prisma, {
      listenerScope: AccessScope.PRIVATE,
      lifecycleState: ShowcaseLifecycleState.CREATION,
      title: "Invite Listener Showcase",
    });

    const response = await listShowcases(new Request("http://localhost/api/showcases/list"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: true;
      data: {
        showcases: Array<{ title: string; listenerScope: string }>;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.showcases).toHaveLength(1);
    expect(body.data.showcases[0].title).toBe("Public Listener Showcase");
    expect(body.data.showcases[0].listenerScope).toBe("public");
  });

  it("includes private-listener showcases when caller accepted listener invite", async () => {
    const userId = "auth0|listener-user";
    mockSession(userId);

    const privateShowcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PRIVATE,
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      title: "Invite Listener Showcase",
    });

    await createInvite(prisma, {
      showcaseId: privateShowcase.id,
      scope: InviteScope.LISTENER,
      acceptedByUserId: userId,
      acceptedAt: new Date(),
    });

    const response = await listShowcases(new Request("http://localhost/api/showcases/list"));
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      ok: true;
      data: {
        showcases: Array<{ showcaseId: string }>;
      };
    };

    expect(body.data.showcases.some((showcase) => showcase.showcaseId === privateShowcase.id)).toBe(true);
  });
});

describe("GET /api/showcases/[showcaseId]/read", () => {
  it("returns 403 for private-listener showcase when caller has no accepted invite", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PRIVATE,
      title: "Invite-Only Read",
      lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
    });

    const response = await readShowcase(
      new Request(`http://localhost/api/showcases/${showcase.id}/read`),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "policy-denied",
        details: {
          policyDenialReason: "invite-required",
        },
      },
    });
  });

  it("returns showcase lifecycle, scopes, and schedule when caller can listen", async () => {
    mockNoSession();

    const submissionOpensAt = new Date("2026-07-01T00:00:00.000Z");
    const submissionClosesAt = new Date("2026-07-05T00:00:00.000Z");
    const votingOpensAt = new Date("2026-07-05T00:00:00.000Z");
    const votingClosesAt = new Date("2026-07-10T00:00:00.000Z");

    const showcase = await createShowcase(prisma, {
      title: "Readable Public Showcase",
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      submissionOpensAt,
      submissionClosesAt,
      votingOpensAt,
      votingClosesAt,
    });

    const response = await readShowcase(
      new Request(`http://localhost/api/showcases/${showcase.id}/read`),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        lifecycleState: "submission-open",
        participationScope: "invite-only",
        listenerScope: "public",
        voterScope: "invite-only-authenticated",
        submissionOpensAt: submissionOpensAt.toISOString(),
        submissionClosesAt: submissionClosesAt.toISOString(),
        votingOpensAt: votingOpensAt.toISOString(),
        votingClosesAt: votingClosesAt.toISOString(),
      },
    });
  });
});
