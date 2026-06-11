/**
 * Sample integration test: verifies that the test database is reachable,
 * migrations have been applied, and basic CRUD round-trips work.
 *
 * Run with: npm run test:integration
 */
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createShowcase, createUser } from "@/src/test/fixtures/factories";
import { cleanTestDatabase, getTestPrisma } from "@/src/test/db";

const prisma = getTestPrisma();

afterEach(async () => {
  await cleanTestDatabase(prisma);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("test database connectivity", () => {
  it("creates and retrieves a showcase", async () => {
    const host = createUser({ name: "Integration Host" });

    const created = await createShowcase(prisma, {
      title: "Integration Test Showcase",
      hostUserId: host.id,
    });

    const found = await prisma.showcase.findUnique({ where: { id: created.id } });

    expect(found).not.toBeNull();
    expect(found?.title).toBe("Integration Test Showcase");
    expect(found?.hostUserId).toBe(host.id);
  });

  it("cleans up between tests — no rows from previous test remain", async () => {
    const count = await prisma.showcase.count();
    expect(count).toBe(0);
  });
});
