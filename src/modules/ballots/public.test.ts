import { describe, expect, it } from "vitest";
import { validateRankedBallot } from "@/src/modules/ballots/public";

describe("ranked ballot validation boundary", () => {
  it("accepts a valid partial ballot", () => {
    const result = validateRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "a" },
        ],
      },
      3,
    );

    expect(result).toEqual({ isValid: true });
  });

  it("accepts contiguous unique picks within max count", () => {
    const result = validateRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "a" },
          { rank: 2, participantId: "b" },
        ],
      },
      3,
    );

    expect(result).toEqual({ isValid: true });
  });

  it("rejects ballots with too many picks", () => {
    const result = validateRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "a" },
          { rank: 2, participantId: "b" },
          { rank: 3, participantId: "c" },
        ],
      },
      2,
    );

    expect(result).toEqual({ isValid: false, reason: "too-many-picks" });
  });

  it("rejects duplicate participants with exact reason code", () => {
    const result = validateRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "a" },
          { rank: 2, participantId: "a" },
        ],
      },
      3,
    );

    expect(result).toEqual({ isValid: false, reason: "duplicate-participant" });
  });

  it("rejects non-contiguous ranks with exact reason code", () => {
    const result = validateRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "a" },
          { rank: 3, participantId: "b" },
        ],
      },
      3,
    );

    expect(result).toEqual({ isValid: false, reason: "non-contiguous-ranks" });
  });
});
