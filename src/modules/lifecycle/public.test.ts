import { describe, expect, it } from "vitest";
import {
  canTransitionLifecycle,
  fromPrismaLifecycleState,
  isFinalizationImmutable,
  isRuleLockedForLifecycle,
  toPrismaLifecycleState,
} from "@/src/modules/lifecycle/public";

describe("lifecycle boundary rules", () => {
  it("allows only guarded lifecycle transitions", () => {
    expect(canTransitionLifecycle("creation", "submission-open")).toBe(true);
    expect(canTransitionLifecycle("submission-open", "voting-open")).toBe(true);
    expect(canTransitionLifecycle("voting-open", "finalized")).toBe(true);

    expect(canTransitionLifecycle("submission-open", "creation")).toBe(false);
    expect(canTransitionLifecycle("finalized", "voting-open")).toBe(false);
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

  it("maps lifecycle states to and from prisma values", () => {
    expect(toPrismaLifecycleState("creation")).toBe("CREATION");
    expect(toPrismaLifecycleState("submission-open")).toBe("SUBMISSION_OPEN");
    expect(toPrismaLifecycleState("voting-open")).toBe("VOTING_OPEN");
    expect(toPrismaLifecycleState("finalized")).toBe("FINALIZED");

    expect(fromPrismaLifecycleState("CREATION")).toBe("creation");
    expect(fromPrismaLifecycleState("SUBMISSION_OPEN")).toBe("submission-open");
    expect(fromPrismaLifecycleState("VOTING_OPEN")).toBe("voting-open");
    expect(fromPrismaLifecycleState("FINALIZED")).toBe("finalized");
    expect(fromPrismaLifecycleState("VOIDED")).toBeNull();
  });
});
