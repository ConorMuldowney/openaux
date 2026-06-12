import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts", "app/**/*.integration.test.ts"],
    globalSetup: ["src/test/global-setup.ts"],
    setupFiles: ["src/test/integration-setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    // Give migrations time to run on first run
    testTimeout: 30_000,
    // Integration tests share a single database — run files sequentially to
    // prevent afterEach cleanTestDatabase calls in one file from racing against
    // mid-test DB operations in another file.
    fileParallelism: false,

  },
});
