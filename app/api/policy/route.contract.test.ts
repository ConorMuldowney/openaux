import { describe, expect, it } from "vitest";
import { POST as hostCreatePost } from "@/app/api/policy/host-create/route";
import { POST as hostUpdatePost } from "@/app/api/policy/host-update/route";
import { POST as inviteAcceptPost } from "@/app/api/policy/invite-accept/route";
import { POST as listenPost } from "@/app/api/policy/listen/route";
import { POST as submitEntryPost } from "@/app/api/policy/submit-entry/route";
import { POST as votePost } from "@/app/api/policy/vote/route";

type RouteCase = {
  name: string;
  handler: (request: Request) => Promise<Response>;
  validBody: Record<string, unknown>;
  successFlag: string;
};

const CASES: RouteCase[] = [
  {
    name: "host-create",
    handler: hostCreatePost,
    validBody: { isAuthenticated: true, isVerifiedEmail: true },
    successFlag: "canCreateHost",
  },
  {
    name: "host-update",
    handler: hostUpdatePost,
    validBody: { isAuthenticated: true, isVerifiedEmail: true, isHostOfShowcase: true },
    successFlag: "canUpdateHost",
  },
  {
    name: "invite-accept",
    handler: inviteAcceptPost,
    validBody: { isAuthenticated: true },
    successFlag: "canAcceptInvite",
  },
  {
    name: "listen",
    handler: listenPost,
    validBody: { listenerScope: "public", isInvited: false },
    successFlag: "canListen",
  },
  {
    name: "submit-entry",
    handler: submitEntryPost,
    validBody: { participationScope: "invite-only", isAuthenticated: true, isInvited: true },
    successFlag: "canSubmitEntry",
  },
  {
    name: "vote",
    handler: votePost,
    validBody: {
      voterScope: "public-authenticated",
      isAuthenticated: true,
      isVerifiedEmail: true,
      isInvited: false,
      isParticipantInShowcase: false,
    },
    successFlag: "canVote",
  },
];

function makeJsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeInvalidJsonRequest(url: string): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json",
  });
}

describe("policy routes contract coverage", () => {
  it.each(CASES)("returns success envelope for $name", async ({ name, handler, validBody, successFlag }) => {
    const response = await handler(makeJsonRequest(`http://localhost/api/policy/${name}`, validBody));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({ ok: true });
    expect(body.data[successFlag]).toBe(true);
  });

  it.each(CASES)("returns validation envelope for invalid JSON on $name", async ({ name, handler }) => {
    const response = await handler(makeInvalidJsonRequest(`http://localhost/api/policy/${name}`));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({
      ok: false,
      error: {
        code: "validation-error",
        message: "Request validation failed.",
      },
    });
    expect(body.error.code).toBe("validation-error");
    expect(body.error.details.validationIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "body",
          issueCode: "custom",
        }),
      ]),
    );
  });
});
