import { describe, expect, it } from "vitest";
import { shouldRevealParticipantIdentity } from "@/src/modules/visibility/public";

describe("blind reveal boundary rules", () => {
  it("reveals identities during all states when blind judging is disabled", () => {
    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: false,
        lifecycleState: "creation",
      }),
    ).toBe(true);

    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: false,
        lifecycleState: "voting-open",
      }),
    ).toBe(true);
  });

  it("reveals identities only after finalization when blind judging is enabled", () => {
    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: true,
        lifecycleState: "creation",
      }),
    ).toBe(false);

    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: true,
        lifecycleState: "submission-open",
      }),
    ).toBe(false);

    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: true,
        lifecycleState: "voting-open",
      }),
    ).toBe(false);

    expect(
      shouldRevealParticipantIdentity({
        isBlindJudgingEnabled: true,
        lifecycleState: "finalized",
      }),
    ).toBe(true);
  });
});
