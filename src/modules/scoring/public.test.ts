import { describe, expect, it } from "vitest";
import {
  rankParticipantsWithTieBreak,
  scoreRankedBallot,
  type TieBreakCandidate,
} from "@/src/modules/scoring/public";

describe("scoring and tie-break boundary rules", () => {
  it("applies borda-style point assignment from max ranked picks", () => {
    const scores = scoreRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "p1" },
          { rank: 2, participantId: "p2" },
          { rank: 3, participantId: "p3" },
        ],
      },
      3,
    );

    expect(scores).toEqual([
      { participantId: "p1", points: 3 },
      { participantId: "p2", points: 2 },
      { participantId: "p3", points: 1 },
    ]);
  });

  it("scores a partial ballot using the configured max ranked picks", () => {
    const scores = scoreRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "p1" },
          { rank: 2, participantId: "p2" },
        ],
      },
      5,
    );

    expect(scores).toEqual([
      { participantId: "p1", points: 5 },
      { participantId: "p2", points: 4 },
    ]);
  });

  it("assigns correct points at the rank bounds for a larger ballot limit", () => {
    const scores = scoreRankedBallot(
      {
        voterId: "voter-1",
        picks: [
          { rank: 1, participantId: "top-rank" },
          { rank: 4, participantId: "bottom-rank" },
        ],
      },
      4,
    );

    expect(scores).toEqual([
      { participantId: "top-rank", points: 4 },
      { participantId: "bottom-rank", points: 1 },
    ]);
  });

  it("breaks ties by rank counts, then earlier submission timestamp", () => {
    const candidates: TieBreakCandidate[] = [
      {
        participantId: "late-submit",
        points: 10,
        rankCounts: [3, 0, 0],
        submittedAt: new Date("2026-06-10T10:00:00.000Z"),
      },
      {
        participantId: "more-first-ranks",
        points: 10,
        rankCounts: [4, 0, 0],
        submittedAt: new Date("2026-06-10T11:00:00.000Z"),
      },
      {
        participantId: "earlier-submit",
        points: 10,
        rankCounts: [3, 0, 0],
        submittedAt: new Date("2026-06-10T09:00:00.000Z"),
      },
      {
        participantId: "lower-points",
        points: 8,
        rankCounts: [9, 9, 9],
        submittedAt: new Date("2026-06-10T01:00:00.000Z"),
      },
    ];

    const ranked = rankParticipantsWithTieBreak(candidates);

    expect(ranked.map((candidate) => candidate.participantId)).toEqual([
      "more-first-ranks",
      "earlier-submit",
      "late-submit",
      "lower-points",
    ]);
  });

  it("uses participant id as the deterministic final ordering fallback", () => {
    const candidates: TieBreakCandidate[] = [
      {
        participantId: "participant-c",
        points: 7,
        rankCounts: [2, 1, 0],
        submittedAt: new Date("2026-06-10T09:00:00.000Z"),
      },
      {
        participantId: "participant-a",
        points: 7,
        rankCounts: [2, 1, 0],
        submittedAt: new Date("2026-06-10T09:00:00.000Z"),
      },
      {
        participantId: "participant-b",
        points: 7,
        rankCounts: [2, 1, 0],
        submittedAt: new Date("2026-06-10T09:00:00.000Z"),
      },
    ];

    const ranked = rankParticipantsWithTieBreak(candidates);

    expect(ranked.map((candidate) => candidate.participantId)).toEqual([
      "participant-a",
      "participant-b",
      "participant-c",
    ]);
  });
});
