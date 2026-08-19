import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { reconcileScheduledLifecycle } from "./schedule";

describe("reconcileScheduledLifecycle", () => {
  it("stops when a conditional transition loses a conflict without a state change", async () => {
    const showcase = {
      id: "showcase-1",
      lifecycleState: "CREATION" as const,
      submissionOpensAt: new Date("2026-01-01T00:00:00.000Z"),
      votingOpensAt: null,
    };
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const findUnique = vi.fn().mockResolvedValue(showcase);
    const prisma = {
      $transaction: async (callback: (tx: { showcase: { updateMany: typeof updateMany } }) => unknown) =>
        callback({ showcase: { updateMany } }),
      showcase: { findUnique },
    } as unknown as PrismaClient;

    await expect(
      reconcileScheduledLifecycle(prisma, showcase, new Date("2026-01-02T00:00:00.000Z")),
    ).resolves.toBe("CREATION");

    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(findUnique).toHaveBeenCalledTimes(1);
  });
});