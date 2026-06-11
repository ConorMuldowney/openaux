import { config as loadEnv } from "dotenv";
import { resolve } from "path";

// Ensure integration test workers always expose DATABASE_URL for app-level Prisma.
loadEnv({ path: resolve(process.cwd(), ".env.test.local"), override: false });

if (!process.env.DATABASE_URL && process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}
