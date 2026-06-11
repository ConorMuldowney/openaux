import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Ensure integration test workers always expose DATABASE_URL for app-level Prisma.
loadEnv({ path: resolve(process.cwd(), ".env.test.local"), override: false });

// For integration tests, TEST_DATABASE_URL must always redirect app-level Prisma.
// This ensures the route handler uses the test database, even if .env.local
// set DATABASE_URL to a different (dev) database.
if (!process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL must be set in .env.test.local to run integration tests.",
  );
}
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
