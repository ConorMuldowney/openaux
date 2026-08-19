import { AccessScope, ShowcaseLifecycleState } from "@prisma/client";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { auth0 } from "@/src/auth/auth0";
import {
  createEntry,
  createParticipant,
  createShowcase,
} from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";
import { GET as readEntries } from "@/app/api/showcases/[showcaseId]/entries/route";
import { GET as readResults } from "@/app/api/showcases/[showcaseId]/results/route";

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

afterEach(async () => {
  await cleanTestDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/showcases/[showcaseId]/entries", () => {
  it("masks participant identity during active blind-judging phases", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
      blindJudgingEnabled: true,
    });

    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: participant.id,
      isValid: true,
    });

    const response = await readEntries(
      new Request(`http://localhost/api/showcases/${showcase.id}/entries`),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        lifecycleState: "voting-open",
        blindJudgingEnabled: true,
        entries: [
          {
            participantId: null,
            participantAlias: "Participant 1",
            isValidForRequiredSamples: true,
          },
        ],
      },
    });
  });

  it("reveals participant identity after finalization", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.FINALIZED,
      blindJudgingEnabled: true,
    });

    const participant = await createParticipant(prisma, { showcaseId: showcase.id });
    await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: participant.id,
      isValid: false,
    });

    const response = await readEntries(
      new Request(`http://localhost/api/showcases/${showcase.id}/entries`),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      ok: true;
      data: {
        entries: Array<{
          participantId: string | null;
          participantAlias: string | null;
          isValidForRequiredSamples: boolean;
        }>;
      };
    };

    expect(body.data.entries).toHaveLength(1);
    expect(body.data.entries[0].participantId).toBe(participant.id);
    expect(body.data.entries[0].participantAlias).toBeNull();
    expect(body.data.entries[0].isValidForRequiredSamples).toBe(false);
  });
});

describe("GET /api/showcases/[showcaseId]/results", () => {
  it("returns 409 when showcase is not finalized", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.VOTING_OPEN,
    });

    const response = await readResults(
      new Request(`http://localhost/api/showcases/${showcase.id}/results`),
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
  });

  it("returns finalized rank ordering and Borda points", async () => {
    mockNoSession();

    const showcase = await createShowcase(prisma, {
      listenerScope: AccessScope.PUBLIC,
      lifecycleState: ShowcaseLifecycleState.FINALIZED,
      maxRankedPicks: 3,
    });

    const p1 = await createParticipant(prisma, { showcaseId: showcase.id });
    const p2 = await createParticipant(prisma, { showcaseId: showcase.id });

    await prisma.finalStandings.create({
      data: {
        showcaseId: showcase.id,
        standings: [
          { rank: 1, participantId: p1.id, points: 8, rankCounts: [2, 0, 0] },
          { rank: 2, participantId: p2.id, points: 5, rankCounts: [0, 2, 0] },
        ],
      },
    });

    const response = await readResults(
      new Request(`http://localhost/api/showcases/${showcase.id}/results`),
      {
        params: Promise.resolve({ showcaseId: showcase.id }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      data: {
        showcaseId: showcase.id,
        standings: [
          { rank: 1, participantId: p1.id, points: 8 },
          { rank: 2, participantId: p2.id, points: 5 },
        ],
      },
    });
  });
});
