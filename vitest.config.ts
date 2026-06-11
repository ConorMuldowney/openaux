import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "app/**/*.test.ts"],
    exclude: ["**/*.integration.test.ts", "node_modules/**"],
    clearMocks: true,
    restoreMocks: true,
  },
});
