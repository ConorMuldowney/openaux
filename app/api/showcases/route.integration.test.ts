import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedEmailRequiredResponse } from "@/src/api/route-handler";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

const testPrisma = getTestPrisma();

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { POST } from "@/app/api/showcases/route";

function createShowcasePayload() {
  return {
    title: "Summer Solstice Showcase 2026",
    participationScope: "invite-only",
    listenerScope: "public",
    voterScope: "public-authenticated",
    blindJudgingEnabled: true,
    maxRankedPicks: 5,
    requiredSampleIds: ["sample-kick", "sample-bass"],
    submissionOpensAt: "2026-07-01T00:00:00.000Z",
    submissionClosesAt: "2026-07-10T00:00:00.000Z",
    votingOpensAt: "2026-07-10T00:00:00.000Z",
    votingClosesAt: "2026-07-20T00:00:00.000Z",
  };
}

afterEach(async () => {
  await cleanTestDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("showcase create route integration", () => {
  it("rejects requests from users without verified email", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: false,
      response: verifiedEmailRequiredResponse(
        "You must verify your email address before performing this action.",
      ),
    } as never);

    const response = await POST(
      new Request("http://localhost/api/showcases", {
        method: "POST",
        body: JSON.stringify(createShowcasePayload()),
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

  it("creates showcase in CREATION lifecycle and returns detail payload", async () => {
    const hostUserId = "auth0|host-showcase-create";
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: hostUserId,
          email_verified: true,
        },
      },
    } as never);

    const response = await POST(
      new Request("http://localhost/api/showcases", {
        method: "POST",
        body: JSON.stringify(createShowcasePayload()),
      }),
    );

    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      ok: true;
      data: {
        showcaseId: string;
        slug: string;
        title: string;
        hostUserId: string;
        lifecycleState: string;
      };
    };

    expect(body.ok).toBe(true);
    expect(body.data.title).toBe("Summer Solstice Showcase 2026");
    expect(body.data.hostUserId).toBe(hostUserId);
    expect(body.data.lifecycleState).toBe("creation");
    expect(body.data.slug).toBe("summer-solstice-showcase-2026");

    const createdShowcase = await testPrisma.showcase.findUnique({
      where: { id: body.data.showcaseId },
      select: {
        title: true,
        slug: true,
        hostUserId: true,
        lifecycleState: true,
        requiredSampleIds: true,
      },
    });

    expect(createdShowcase).toBeTruthy();
    expect(createdShowcase?.title).toBe("Summer Solstice Showcase 2026");
    expect(createdShowcase?.slug).toBe("summer-solstice-showcase-2026");
    expect(createdShowcase?.hostUserId).toBe(hostUserId);
    expect(createdShowcase?.lifecycleState).toBe("CREATION");
    expect(createdShowcase?.requiredSampleIds).toEqual(["sample-kick", "sample-bass"]);
  });

  it("rejects non-UTC schedule timestamps", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: "auth0|host-showcase-create",
          email_verified: true,
        },
      },
    } as never);

    const payload = {
      ...createShowcasePayload(),
      submissionOpensAt: "2026-07-01T00:00:00+01:00",
    };

    const response = await POST(
      new Request("http://localhost/api/showcases", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "validation-error",
      },
    });
  });
});
