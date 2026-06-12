import { ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedEmailRequiredResponse } from "@/src/api/route-handler";
import { createShowcase, createUser } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

const testPrisma = getTestPrisma();

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { requireVerifiedEmailSession } from "@/src/api/auth";
import { GET, PATCH } from "@/app/api/showcases/[showcaseId]/route";

afterEach(async () => {
  await cleanTestDatabase(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("showcase detail and update route integration", () => {
  it("rejects detail reads from users without verified email", async () => {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: false,
      response: verifiedEmailRequiredResponse(
        "You must verify your email address before performing this action.",
      ),
    } as never);

    const response = await GET(new Request("http://localhost/api/showcases/test"), {
      params: Promise.resolve({ showcaseId: "85cf756f-fbb1-4988-b27f-52b352f45f84" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "verified-email-required",
      },
    });
  });

  it("denies detail reads to non-host users", async () => {
    const hostUser = createUser({ name: "Showcase Host" });
    const nonHostUser = createUser({ name: "Non Host" });

    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: nonHostUser.id,
          email_verified: true,
        },
      },
    } as never);

    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.CREATION,
    });

    const response = await GET(new Request(`http://localhost/api/showcases/${showcase.id}`), {
      params: Promise.resolve({ showcaseId: showcase.id }),
    });

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

  it("returns showcase detail for host user", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

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
      title: "Host Detail Showcase",
      lifecycleState: ShowcaseLifecycleState.CREATION,
      participationScope: "PRIVATE",
      listenerScope: "PUBLIC",
      voterScope: "PRIVATE",
      maxRankedPicks: 4,
      requiredSampleIds: ["sample-a"],
    });

    const response = await GET(new Request(`http://localhost/api/showcases/${showcase.id}`), {
      params: Promise.resolve({ showcaseId: showcase.id }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        title: "Host Detail Showcase",
        hostUserId: hostUser.id,
        lifecycleState: "creation",
        participationScope: "invite-only",
        listenerScope: "public",
        voterScope: "invite-only-authenticated",
      },
    });
  });

  it("updates settings before submission opens", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

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
      title: "Before Update Showcase",
      lifecycleState: ShowcaseLifecycleState.CREATION,
      submissionOpensAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requiredSampleIds: ["sample-old"],
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "After Update Showcase",
          blindJudgingEnabled: false,
          maxRankedPicks: 6,
          requiredSampleIds: ["sample-new-a", "sample-new-b"],
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        title: "After Update Showcase",
        blindJudgingEnabled: false,
        maxRankedPicks: 6,
        requiredSampleIds: ["sample-new-a", "sample-new-b"],
      },
    });

    const updatedShowcase = await testPrisma.showcase.findUnique({
      where: { id: showcase.id },
      select: {
        title: true,
        blindJudgingEnabled: true,
        maxRankedPicks: true,
        requiredSampleIds: true,
      },
    });

    expect(updatedShowcase).toMatchObject({
      title: "After Update Showcase",
      blindJudgingEnabled: false,
      maxRankedPicks: 6,
      requiredSampleIds: ["sample-new-a", "sample-new-b"],
    });
  });

  it("returns settings-locked after submission opens", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

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
      title: "Locked Showcase",
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: "Should Not Update",
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "settings-locked",
      },
    });

    const unchangedShowcase = await testPrisma.showcase.findUnique({
      where: { id: showcase.id },
      select: {
        title: true,
      },
    });

    expect(unchangedShowcase?.title).toBe("Locked Showcase");
  });

  it("allows cancel while submissions are open and writes an applied host-control audit", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

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
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      votingOpensAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hostControl: {
            action: "cancel-showcase",
            reason: "Host canceled by request",
          },
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        lifecycleState: "canceled",
      },
    });

    const auditEvents = await testPrisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].fromState).toBe(ShowcaseLifecycleState.SUBMISSION_OPEN);
    expect(auditEvents[0].toState).toBe(ShowcaseLifecycleState.CANCELED);
    expect((auditEvents[0].metadata as Record<string, unknown>)?.action).toBe("cancel-showcase");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("applied");
  });

  it("denies cancel once voting is open and writes a rejected host-control audit", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

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
      lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hostControl: {
            action: "cancel-showcase",
          },
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
      },
    });

    const auditEvents = await testPrisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    expect(auditEvents).toHaveLength(1);
    expect((auditEvents[0].metadata as Record<string, unknown>)?.action).toBe("cancel-showcase");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("rejected");
  });

  it("allows submission-close extension while submissions are open and before voting", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: hostUser.id,
          email_verified: true,
        },
      },
    } as never);

    const currentSubmissionClose = new Date(Date.now() + 30 * 60 * 1000);
    const votingOpensAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const nextSubmissionClose = new Date(Date.now() + 60 * 60 * 1000);

    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      submissionClosesAt: currentSubmissionClose,
      votingOpensAt,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hostControl: {
            action: "extend-submission-close",
            submissionClosesAt: nextSubmissionClose.toISOString(),
          },
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: true; data: { submissionClosesAt: string } };
    expect(new Date(body.data.submissionClosesAt).toISOString()).toBe(nextSubmissionClose.toISOString());

    const auditEvents = await testPrisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    expect(auditEvents).toHaveLength(1);
    expect((auditEvents[0].metadata as Record<string, unknown>)?.action).toBe("extend-submission-close");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("applied");
  });

  it("denies submission-close extension at or after voting opens", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: hostUser.id,
          email_verified: true,
        },
      },
    } as never);

    const submissionClose = new Date(Date.now() + 30 * 60 * 1000);
    const votingOpensAt = new Date(Date.now() + 45 * 60 * 1000);
    const invalidNewSubmissionClose = new Date(Date.now() + 50 * 60 * 1000);

    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      submissionClosesAt: submissionClose,
      votingOpensAt,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hostControl: {
            action: "extend-submission-close",
            submissionClosesAt: invalidNewSubmissionClose.toISOString(),
          },
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "state-invalid",
      },
    });

    const auditEvents = await testPrisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    expect(auditEvents).toHaveLength(1);
    expect((auditEvents[0].metadata as Record<string, unknown>)?.action).toBe("extend-submission-close");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("rejected");
  });

  it("allows voting-close extension while voting is open", async () => {
    const hostUser = createUser({ name: "Showcase Host" });

    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: hostUser.id,
          email_verified: true,
        },
      },
    } as never);

    const currentVotingClose = new Date(Date.now() + 30 * 60 * 1000);
    const nextVotingClose = new Date(Date.now() + 90 * 60 * 1000);

    const showcase = await createShowcase(testPrisma, {
      hostUserId: hostUser.id,
      lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
      votingClosesAt: currentVotingClose,
    });

    const response = await PATCH(
      new Request(`http://localhost/api/showcases/${showcase.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          hostControl: {
            action: "extend-voting-close",
            votingClosesAt: nextVotingClose.toISOString(),
          },
        }),
      }),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: true; data: { votingClosesAt: string } };
    expect(new Date(body.data.votingClosesAt).toISOString()).toBe(nextVotingClose.toISOString());

    const auditEvents = await testPrisma.transitionAuditEvent.findMany({
      where: { showcaseId: showcase.id },
      orderBy: { occurredAt: "desc" },
      take: 1,
    });

    expect(auditEvents).toHaveLength(1);
    expect((auditEvents[0].metadata as Record<string, unknown>)?.action).toBe("extend-voting-close");
    expect((auditEvents[0].metadata as Record<string, unknown>)?.outcome).toBe("applied");
  });
});
