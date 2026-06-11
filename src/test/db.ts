/**
 * Shared Prisma client and cleanup helpers for integration tests.
 *
 * Usage in a test file:
 *
 *   import { getTestPrisma, cleanTestDatabase } from "@/src/test/db";
 *
 *   const prisma = getTestPrisma();
 *
 *   afterEach(async () => {
 *     await cleanTestDatabase(prisma);
 *   });
 *
 *   afterAll(async () => {
 *     await prisma.$disconnect();
 *   });
 */
import { PrismaClient } from "@prisma/client";

let _testPrisma: PrismaClient | null = null;

/**
 * Returns a singleton PrismaClient connected to the TEST_DATABASE_URL.
 * Throws if TEST_DATABASE_URL is not set (caught earlier by global-setup).
 */
export function getTestPrisma(): PrismaClient {
  if (!_testPrisma) {
    _testPrisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
    });
  }
  return _testPrisma;
}

/**
 * Deletes all rows in the correct dependency order.
 * Showcase cascades to most models; InviteAcceptanceAuditEvent uses SetNull
 * so it must be deleted first to avoid orphan rows accumulating.
 */
export async function cleanTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.inviteAcceptanceAuditEvent.deleteMany(),
    prisma.showcase.deleteMany(),
  ]);
}
