import { describe, expect, it } from "vitest";
import {
  SHOWCASE_LIFECYCLE_STATES,
  canTransitionLifecycle,
  canUpdateShowcaseField,
  fromPrismaLifecycleState,
  isFinalizationImmutable,
  isRuleLockedForLifecycle,
  type ShowcaseLifecycleState,
  toPrismaLifecycleState,
} from "@/src/modules/lifecycle/public";

describe("lifecycle boundary rules", () => {
  it("enforces the lifecycle transition matrix across all states", () => {
    const expectedTransitions: Record<
      ShowcaseLifecycleState,
      readonly ShowcaseLifecycleState[]
    > = {
      creation: ["submission-open", "finalized"],
      "submission-open": ["voting-open"],
      "voting-open": ["finalized"],
      finalized: [],
    };

    for (const currentState of SHOWCASE_LIFECYCLE_STATES) {
      for (const nextState of SHOWCASE_LIFECYCLE_STATES) {
        const expected = expectedTransitions[currentState].includes(nextState);
        expect(canTransitionLifecycle(currentState, nextState)).toBe(expected);
      }
    }
  });

  it("locks fairness-critical rules once submissions open", () => {
    expect(isRuleLockedForLifecycle("creation", "voter-scope")).toBe(false);
    expect(isRuleLockedForLifecycle("creation", "max-ranked-picks")).toBe(false);
    expect(isRuleLockedForLifecycle("creation", "blind-judging")).toBe(false);

    expect(isRuleLockedForLifecycle("submission-open", "voter-scope")).toBe(true);
    expect(isRuleLockedForLifecycle("submission-open", "max-ranked-picks")).toBe(true);
    expect(isRuleLockedForLifecycle("submission-open", "blind-judging")).toBe(true);

    expect(isRuleLockedForLifecycle("voting-open", "listener-scope")).toBe(false);
    expect(isRuleLockedForLifecycle("finalized", "listener-scope")).toBe(false);
  });

  it("treats finalized showcases as immutable", () => {
    expect(isFinalizationImmutable("finalized")).toBe(true);
    expect(isFinalizationImmutable("creation")).toBe(false);
  });

  it("maps each lifecycle state to and from persisted prisma values", () => {
    const expectedPrismaStateByDomainState = {
      creation: "CREATION",
      "submission-open": "SUBMISSION_OPEN",
      "voting-open": "VOTING_OPEN",
      finalized: "FINALIZED",
    } as const;

    for (const domainState of SHOWCASE_LIFECYCLE_STATES) {
      const persistedState = expectedPrismaStateByDomainState[domainState];
      expect(toPrismaLifecycleState(domainState)).toBe(persistedState);
      expect(fromPrismaLifecycleState(persistedState)).toBe(domainState);
    }
  });

  it("returns null for unsupported persisted lifecycle states", () => {
    expect(fromPrismaLifecycleState("VOIDED")).toBeNull();
    expect(fromPrismaLifecycleState("CREATION ")).toBeNull();
    expect(fromPrismaLifecycleState("creation")).toBeNull();
    expect(fromPrismaLifecycleState("UNKNOWN")).toBeNull();
  });

  it("allows updating all fields during creation phase", () => {
    expect(canUpdateShowcaseField("creation", "voter-scope")).toEqual({ allowed: true });
    expect(canUpdateShowcaseField("creation", "max-ranked-picks")).toEqual({ allowed: true });
    expect(canUpdateShowcaseField("creation", "blind-judging")).toEqual({ allowed: true });
    expect(canUpdateShowcaseField("creation", "listener-scope")).toEqual({ allowed: true });
  });

  it("prevents updating locked fields after submission open", () => {
    expect(canUpdateShowcaseField("submission-open", "voter-scope")).toEqual({
      allowed: false,
      reason: "rule-locked",
    });
    expect(canUpdateShowcaseField("submission-open", "max-ranked-picks")).toEqual({
      allowed: false,
      reason: "rule-locked",
    });
    expect(canUpdateShowcaseField("submission-open", "blind-judging")).toEqual({
      allowed: false,
      reason: "rule-locked",
    });
  });

  it("allows updating listener-scope at any stage except finalized", () => {
    expect(canUpdateShowcaseField("creation", "listener-scope")).toEqual({ allowed: true });
    expect(canUpdateShowcaseField("submission-open", "listener-scope")).toEqual({ allowed: true });
    expect(canUpdateShowcaseField("voting-open", "listener-scope")).toEqual({ allowed: true });
  });

  it("prevents updating any field when finalized", () => {
    expect(canUpdateShowcaseField("finalized", "voter-scope")).toEqual({
      allowed: false,
      reason: "finalized-immutable",
    });
    expect(canUpdateShowcaseField("finalized", "listener-scope")).toEqual({
      allowed: false,
      reason: "finalized-immutable",
    });
    expect(canUpdateShowcaseField("finalized", "blind-judging")).toEqual({
      allowed: false,
      reason: "finalized-immutable",
    });
    expect(canUpdateShowcaseField("finalized", "max-ranked-picks")).toEqual({
      allowed: false,
      reason: "finalized-immutable",
    });
  });
});
