/**
 * Vitest global setup for integration tests.
 *
 * Runs once before all integration test files.
 * Applies pending Prisma migrations to the TEST_DATABASE_URL.
 */
import { execSync } from "child_process";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";

export async function setup(): Promise<void> {
  // globalSetup runs in a plain Node process — load .env.test.local manually
  // so TEST_DATABASE_URL is available when set via that file.
  loadEnv({ path: resolve(process.cwd(), ".env.test.local"), override: false });
  const testDatabaseUrl = process.env.TEST_DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error(
      "TEST_DATABASE_URL must be set to run integration tests.\n" +
        "Add it to .env.test.local or export it before running `npm run test:integration`.",
    );
  }

  // Keep Prisma's default datasource env available for any code paths
  // that instantiate the app-level client during integration tests.
  process.env.DATABASE_URL ??= testDatabaseUrl;

  console.log("[integration] Applying migrations to test database…");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    stdio: "inherit",
  });
  console.log("[integration] Migrations complete.");
}
