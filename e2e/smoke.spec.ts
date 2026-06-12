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
  expect(Array.isArray(body.uptimeChecks)).toBe(true);
});

test("critical API uptime checks return expected statuses", async ({ request }) => {
  const voteResponse = await request.post("/api/policy/vote", {
    failOnStatusCode: false,
    data: {
      voterScope: "public-authenticated",
      isAuthenticated: true,
      isVerifiedEmail: true,
      isInvited: true,
      isParticipantInShowcase: false,
    },
  });
  expect([200, 403]).toContain(voteResponse.status());

  const lifecycleResponse = await request.post("/api/lifecycle/transition", {
    failOnStatusCode: false,
    data: {
      showcaseId: "00000000-0000-0000-0000-000000000000",
      nextState: "finalized",
    },
  });
  expect(lifecycleResponse.status()).toBe(401);

  const finalStandingsResponse = await request.post("/api/scoring/final-standings", {
    failOnStatusCode: false,
    data: {
      showcaseId: "00000000-0000-0000-0000-000000000000",
    },
  });
  expect(finalStandingsResponse.status()).toBe(401);
});
