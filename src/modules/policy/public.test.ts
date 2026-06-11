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

    expect(
      evaluateHostUpdatePolicy({
        isAuthenticated: true,
        isVerifiedEmail: true,
        isHostOfShowcase: true,
      }),
    ).toEqual({ allowed: true });
  });

  it("requires authentication for invite acceptance", () => {
    expect(evaluateInviteAcceptPolicy({ isAuthenticated: false })).toEqual({
      allowed: false,
      reason: "authentication-required",
    });

    expect(evaluateInviteAcceptPolicy({ isAuthenticated: true })).toEqual({ allowed: true });
  });

  describe("private participation scope (invite-only)", () => {
    it("denies unauthenticated users regardless of invite status", () => {
      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "invite-only",
          isAuthenticated: false,
          isInvited: false,
        }),
      ).toEqual({ allowed: false, reason: "authentication-required" });

      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "invite-only",
          isAuthenticated: false,
          isInvited: true,
        }),
      ).toEqual({ allowed: false, reason: "authentication-required" });
    });

    it("denies authenticated users without an invite", () => {
      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "invite-only",
          isAuthenticated: true,
          isInvited: false,
        }),
      ).toEqual({ allowed: false, reason: "invite-required" });
    });

    it("allows authenticated invited users", () => {
      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "invite-only",
          isAuthenticated: true,
          isInvited: true,
        }),
      ).toEqual({ allowed: true });
    });
  });

  describe("public participation scope", () => {
    it("denies unauthenticated users", () => {
      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "public",
          isAuthenticated: false,
          isInvited: false,
        }),
      ).toEqual({ allowed: false, reason: "authentication-required" });
    });

    it("allows authenticated users without an invite", () => {
      expect(
        evaluateSubmitEntryPolicy({
          participationScope: "public",
          isAuthenticated: true,
          isInvited: false,
        }),
      ).toEqual({ allowed: true });
    });
  });

  describe("private listening scope (invite-only)", () => {
    it("denies users without an accepted invite", () => {
      expect(
        evaluateListenPolicy({ listenerScope: "invite-only", isInvited: false }),
      ).toEqual({ allowed: false, reason: "invite-required" });
    });

    it("allows users with an accepted invite", () => {
      expect(
        evaluateListenPolicy({ listenerScope: "invite-only", isInvited: true }),
      ).toEqual({ allowed: true });
    });
  });

  describe("public listening scope", () => {
    it("allows anonymous (unauthenticated) users", () => {
      expect(
        evaluateListenPolicy({ listenerScope: "public", isInvited: false }),
      ).toEqual({ allowed: true });
    });

    it("allows authenticated users with or without an invite", () => {
      expect(
        evaluateListenPolicy({ listenerScope: "public", isInvited: false }),
      ).toEqual({ allowed: true });

      expect(
        evaluateListenPolicy({ listenerScope: "public", isInvited: true }),
      ).toEqual({ allowed: true });
    });
  });

  describe("private voting scope (invite-only-authenticated)", () => {
    it("denies unauthenticated users", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "invite-only-authenticated",
          isAuthenticated: false,
          isVerifiedEmail: false,
          isInvited: true,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: false, reason: "authentication-required" });
    });

    it("denies authenticated users without a verified email", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "invite-only-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: false,
          isInvited: true,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: false, reason: "verified-email-required" });
    });

    it("denies participants from voting in their own showcase", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "invite-only-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: true,
          isInvited: true,
          isParticipantInShowcase: true,
        }),
      ).toEqual({ allowed: false, reason: "participant-cannot-vote" });
    });

    it("denies authenticated verified users without an accepted invite", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "invite-only-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: true,
          isInvited: false,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: false, reason: "invite-required" });
    });

    it("allows authenticated verified invited non-participants", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "invite-only-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: true,
          isInvited: true,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: true });
    });
  });

  describe("public voting scope (public-authenticated)", () => {
    it("denies unauthenticated users", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "public-authenticated",
          isAuthenticated: false,
          isVerifiedEmail: false,
          isInvited: false,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: false, reason: "authentication-required" });
    });

    it("denies authenticated users without a verified email", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "public-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: false,
          isInvited: false,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: false, reason: "verified-email-required" });
    });

    it("denies participants from voting in their own showcase", () => {
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

    it("allows authenticated verified non-participants without an invite", () => {
      expect(
        evaluateVotePolicy({
          voterScope: "public-authenticated",
          isAuthenticated: true,
          isVerifiedEmail: true,
          isInvited: false,
          isParticipantInShowcase: false,
        }),
      ).toEqual({ allowed: true });
    });
  });
});
