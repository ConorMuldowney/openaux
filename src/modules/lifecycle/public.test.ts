import { describe, expect, it } from "vitest";
import {
  SHOWCASE_LIFECYCLE_STATES,
  canTransitionLifecycle,
  fromPrismaLifecycleState,
  isFinalizationImmutable,
  isRuleLockedForLifecycle,
  toPrismaLifecycleState,
} from "@/src/modules/lifecycle/public";

describe("lifecycle boundary rules", () => {
  it("enforces the lifecycle transition matrix across all states", () => {
    const expectedTransitions = {
      creation: ["submission-open", "finalized"],
      "submission-open": ["voting-open"],
      "voting-open": ["finalized"],
      finalized: [],
    } as const;

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
});
