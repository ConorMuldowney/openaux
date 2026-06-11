import { describe, expect, it } from "vitest";
import {
  evaluateHostCreatePolicy,
  evaluateHostUpdatePolicy,
  evaluateInviteAcceptPolicy,
  evaluateListenPolicy,
  evaluateSubmitEntryPolicy,
  evaluateVotePolicy,
} from "@/src/modules/policy/public";

describe("policy boundary rules", () => {
  it("requires authentication and verified email for host creation", () => {
    expect(evaluateHostCreatePolicy({ isAuthenticated: false, isVerifiedEmail: true })).toEqual({
      allowed: false,
      reason: "authentication-required",
    });

    expect(evaluateHostCreatePolicy({ isAuthenticated: true, isVerifiedEmail: false })).toEqual({
      allowed: false,
      reason: "verified-email-required",
    });

    expect(evaluateHostCreatePolicy({ isAuthenticated: true, isVerifiedEmail: true })).toEqual({
      allowed: true,
    });
  });

  it("requires host membership for host updates", () => {
    expect(
      evaluateHostUpdatePolicy({
        isAuthenticated: true,
        isVerifiedEmail: true,
        isHostOfShowcase: false,
      }),
    ).toEqual({ allowed: false, reason: "host-membership-required" });
  });

  it("requires authentication for invite acceptance", () => {
    expect(evaluateInviteAcceptPolicy({ isAuthenticated: false })).toEqual({
      allowed: false,
      reason: "authentication-required",
    });

    expect(evaluateInviteAcceptPolicy({ isAuthenticated: true })).toEqual({ allowed: true });
  });

  it("enforces participation and voter scope rules", () => {
    expect(
      evaluateSubmitEntryPolicy({
        participationScope: "invite-only",
        isAuthenticated: true,
        isInvited: false,
      }),
    ).toEqual({ allowed: false, reason: "invite-required" });

    expect(
      evaluateVotePolicy({
        voterScope: "invite-only-authenticated",
        isAuthenticated: true,
        isVerifiedEmail: true,
        isInvited: false,
        isParticipantInShowcase: false,
      }),
    ).toEqual({ allowed: false, reason: "invite-required" });

    expect(
      evaluateVotePolicy({
        voterScope: "public-authenticated",
        isAuthenticated: true,
        isVerifiedEmail: true,
        isInvited: false,
        isParticipantInShowcase: true,
      }),
    ).toEqual({ allowed: false, reason: "participant-cannot-vote" });
  });

  it("allows public listening and restricts invite-only listening", () => {
    expect(evaluateListenPolicy({ listenerScope: "public", isInvited: false })).toEqual({
      allowed: true,
    });

    expect(evaluateListenPolicy({ listenerScope: "invite-only", isInvited: false })).toEqual({
      allowed: false,
      reason: "invite-required",
    });
  });
});
