import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifiedEmailRequiredResponse } from "@/src/api/route-handler";
import { createShowcase } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

vi.mock("@/src/db/prisma", () => ({
  prisma: getTestPrisma(),
}));

vi.mock("@/src/api/auth", () => ({
  requireVerifiedEmailSession: vi.fn(),
}));

import { POST } from "@/app/api/showcase/update/route";
import { requireVerifiedEmailSession } from "@/src/api/auth";

const testPrisma = getTestPrisma();

describe("POST /api/showcase/update", () => {
  let showcaseId: string;
  const hostUserId = "test-host-123";

  function makeRequest(body: unknown) {
    return new Request("http://localhost/api/showcase/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function mockVerifiedSession(userId = hostUserId) {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: true,
      session: {
        user: {
          sub: userId,
        },
      },
    } as never);
  }

  function mockNoSession() {
    vi.mocked(requireVerifiedEmailSession).mockResolvedValue({
      ok: false,
      response: verifiedEmailRequiredResponse("Email verification required"),
    } as never);
  }

  afterEach(async () => {
    await cleanTestDatabase(testPrisma);
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await testPrisma.$disconnect();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    const showcase = await createShowcase(testPrisma, {
      hostUserId,
      participationScope: "PRIVATE",
      listenerScope: "PRIVATE",
      voterScope: "PRIVATE",
      blindJudgingEnabled: true,
      maxRankedPicks: 3,
    });
    showcaseId = showcase.id;
  });

  it("allows updating all fields during creation phase", async () => {
    mockVerifiedSession();

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: {
          voterScope: "public-authenticated",
          listenerScope: "public",
          blindJudgingEnabled: false,
          maxRankedPicks: 5,
        },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);

    const updated = await testPrisma.showcase.findUnique({ where: { id: showcaseId } });
    expect(updated?.voterScope).toBe("PUBLIC");
    expect(updated?.listenerScope).toBe("PUBLIC");
    expect(updated?.blindJudgingEnabled).toBe(false);
    expect(updated?.maxRankedPicks).toBe(5);
  });

  it("prevents updating voter-scope after submission opens", async () => {
    mockVerifiedSession();

    await testPrisma.showcase.update({
      where: { id: showcaseId },
      data: { lifecycleState: "SUBMISSION_OPEN" },
    });

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: { voterScope: "public-authenticated" },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("settings-locked");
  });

  it("prevents updating blind-judging after submission opens", async () => {
    mockVerifiedSession();

    await testPrisma.showcase.update({
      where: { id: showcaseId },
      data: { lifecycleState: "SUBMISSION_OPEN" },
    });

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: { blindJudgingEnabled: false },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.ok).toBe(false);
    expect(data.error.code).toBe("settings-locked");
  });

  it("allows updating listener-scope after submission opens", async () => {
    mockVerifiedSession();

    await testPrisma.showcase.update({
      where: { id: showcaseId },
      data: { lifecycleState: "SUBMISSION_OPEN" },
    });

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: { listenerScope: "public" },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);

    const updated = await testPrisma.showcase.findUnique({ where: { id: showcaseId } });
    expect(updated?.listenerScope).toBe("PUBLIC");
  });

  it("rejects request from non-host user", async () => {
    mockVerifiedSession("different-user-456");

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: { listenerScope: "public" },
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe("policy-denied");
  });

  it("requires email verification", async () => {
    mockNoSession();

    const response = await POST(
      makeRequest({
        showcaseId,
        updates: { listenerScope: "public" },
      }),
    );

    expect(response.status).toBe(403);
  });
});
