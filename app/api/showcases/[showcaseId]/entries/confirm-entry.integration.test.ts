import { AccessScope, ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import { createParticipant, createShowcase } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { POST as confirmEntry } from "@/app/api/showcases/[showcaseId]/entries/route";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

vi.mock("@/src/auth/auth0", () => ({
  auth0: {
    getSession: vi.fn(),
  },
}));

vi.mock("@/src/storage/r2-client", () => ({
  getR2BucketName: () => "openaux-test",
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

function storageKeyFor(showcaseId: string, participantId: string): string {
  return `s3://openaux-test/originals/${showcaseId}/${participantId}/track.wav`;
}

function postRequest(body: unknown) {
  return new Request("http://localhost/api/showcases/confirm/entries", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

describe("POST /api/showcases/[showcaseId]/entries", () => {
  it("returns 401 when unauthenticated", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
    });

    const response = await confirmEntry(
      postRequest({ storageKey: "s3://bucket/key", usedSampleIds: [] }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 409 when the showcase is not open for submissions", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.CREATION,
      participationScope: AccessScope.PUBLIC,
    });
    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    mockSession(participant.userId);

    const response = await confirmEntry(
      postRequest({
        storageKey: storageKeyFor(showcase.id, participant.id),
        usedSampleIds: [],
      }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "state-invalid" },
    });
  });

  it("opens submissions when the scheduled start has passed", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.CREATION,
      participationScope: AccessScope.PUBLIC,
      submissionOpensAt: new Date(Date.now() - 60_000),
      votingOpensAt: new Date(Date.now() + 60 * 60_000),
    });
    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    mockSession(participant.userId);

    const response = await confirmEntry(
      postRequest({
        storageKey: storageKeyFor(showcase.id, participant.id),
        usedSampleIds: [],
      }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(201);
    await expect(
      prisma.showcase.findUnique({ where: { id: showcase.id }, select: { lifecycleState: true } }),
    ).resolves.toMatchObject({ lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN });
    await expect(
      prisma.transitionAuditEvent.findFirst({
        where: { showcaseId: showcase.id, toState: ShowcaseLifecycleState.SUBMISSION_OPEN },
      }),
    ).resolves.toMatchObject({ metadata: { trigger: "schedule" } });
  });

  it("enrolls a public participant before validating the uploaded entry", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      participationScope: AccessScope.PUBLIC,
    });
    const userId = "auth0|public-participant";
    mockSession(userId);

    const response = await confirmEntry(
      postRequest({ storageKey: "s3://openaux-test/originals/not-owned.wav", usedSampleIds: [] }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(409);
    await expect(
      prisma.participant.findUnique({
        where: { showcaseId_userId: { showcaseId: showcase.id, userId } },
      }),
    ).resolves.toMatchObject({ showcaseId: showcase.id, userId });
  });

  it("returns 409 when the storageKey was not issued to this participant", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      participationScope: AccessScope.PUBLIC,
    });
    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    mockSession(participant.userId);

    const response = await confirmEntry(
      postRequest({
        storageKey: "s3://openaux-test/originals/some-other-showcase/some-other-participant/track.wav",
        usedSampleIds: [],
      }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(409);
  });

  it("persists an Entry with the confirmed storageKey and validity", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      participationScope: AccessScope.PUBLIC,
      requiredSampleIds: ["kick", "snare"],
    });
    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    mockSession(participant.userId);

    const storageKey = storageKeyFor(showcase.id, participant.id);
    const response = await confirmEntry(
      postRequest({ storageKey, usedSampleIds: ["kick", "snare"] }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        storageKey,
        isValidForRequiredSamples: true,
      },
    });

    const persisted = await prisma.entry.findUnique({
      where: { participantId_showcaseId: { participantId: participant.id, showcaseId: showcase.id } },
    });
    expect(persisted?.storageKey).toBe(storageKey);
    expect(persisted?.isValid).toBe(true);
  });

  it("resubmits by overwriting the existing Entry for the same participant", async () => {
    const showcase = await createShowcase(prisma, {
      lifecycleState: ShowcaseLifecycleState.SUBMISSION_OPEN,
      participationScope: AccessScope.PUBLIC,
      requiredSampleIds: ["kick"],
    });
    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    mockSession(participant.userId);

    const firstStorageKey = storageKeyFor(showcase.id, participant.id);
    await confirmEntry(postRequest({ storageKey: firstStorageKey, usedSampleIds: [] }), {
      params: Promise.resolve({ showcaseId: showcase.id }),
    });

    const secondStorageKey = `${firstStorageKey}-v2`;
    const response = await confirmEntry(
      postRequest({ storageKey: secondStorageKey, usedSampleIds: ["kick"] }),
      { params: Promise.resolve({ showcaseId: showcase.id }) },
    );

    expect(response.status).toBe(201);

    const entries = await prisma.entry.findMany({ where: { showcaseId: showcase.id } });
    expect(entries).toHaveLength(1);
    expect(entries[0].storageKey).toBe(secondStorageKey);
    expect(entries[0].isValid).toBe(true);
  });
});
