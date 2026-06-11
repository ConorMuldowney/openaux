import { expect, test } from "@playwright/test";

/**
 * Smoke test: verifies the app is running and core services are healthy.
 */
test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.service).toBe("openaux");
  expect(Array.isArray(body.modules)).toBe(true);
});
