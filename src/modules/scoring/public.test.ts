import { describe, expect, it } from "vitest";
import {
  computeShowcaseStandings,
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

describe("computeShowcaseStandings", () => {
  const baseTimestamps = [
    { participantId: "p1", submittedAt: new Date("2026-06-01T10:00:00.000Z") },
    { participantId: "p2", submittedAt: new Date("2026-06-01T11:00:00.000Z") },
    { participantId: "p3", submittedAt: new Date("2026-06-01T12:00:00.000Z") },
  ];

  it("aggregates ballot scores across multiple voters and returns ranked standings", () => {
    const storedBallots = [
      { voterId: "v1", rankedParticipantIds: ["p1", "p2", "p3"] },
      { voterId: "v2", rankedParticipantIds: ["p1", "p3"] },
      { voterId: "v3", rankedParticipantIds: ["p2", "p1"] },
    ];

    const standings = computeShowcaseStandings(storedBallots, 3, baseTimestamps);

    // p1: v1(3) + v2(3) + v3(2) = 8 pts; p2: v1(2) + v3(3) = 5 pts; p3: v1(1) + v2(2) = 3 pts
    expect(standings.map((s) => s.participantId)).toEqual(["p1", "p2", "p3"]);
    expect(standings[0].points).toBe(8);
    expect(standings[0].rank).toBe(1);
    expect(standings[1].points).toBe(5);
    expect(standings[1].rank).toBe(2);
    expect(standings[2].points).toBe(3);
    expect(standings[2].rank).toBe(3);
  });

  it("assigns rank 1 through N consecutively", () => {
    const storedBallots = [
      { voterId: "v1", rankedParticipantIds: ["p1", "p2", "p3"] },
    ];

    const standings = computeShowcaseStandings(storedBallots, 3, baseTimestamps);

    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3]);
  });

  it("includes participants with zero votes from entry timestamps in last place", () => {
    const storedBallots = [
      { voterId: "v1", rankedParticipantIds: ["p1", "p2"] },
    ];

    const standings = computeShowcaseStandings(storedBallots, 3, baseTimestamps);

    const noVoteParticipant = standings.find((s) => s.participantId === "p3");
    expect(noVoteParticipant).toBeDefined();
    expect(noVoteParticipant!.points).toBe(0);
    expect(noVoteParticipant!.rank).toBe(3);
  });

  it("returns an empty array when there are no ballots and no entry timestamps", () => {
    const standings = computeShowcaseStandings([], 3, []);
    expect(standings).toEqual([]);
  });

  it("removes disqualified entries from ballots, compresses ranks, and recomputes totals", () => {
    const storedBallots = [
      { voterId: "v1", rankedParticipantIds: ["p1", "p3", "p2"] },
      { voterId: "v2", rankedParticipantIds: ["p2", "p3", "p1"] },
    ];

    const validEntryTimestamps = [
      { participantId: "p1", submittedAt: new Date("2026-06-01T10:00:00.000Z") },
      { participantId: "p2", submittedAt: new Date("2026-06-01T11:00:00.000Z") },
    ];

    const standings = computeShowcaseStandings(storedBallots, 3, validEntryTimestamps);

    expect(standings.map((s) => s.participantId)).toEqual(["p1", "p2"]);
    expect(standings[0]).toMatchObject({ participantId: "p1", points: 5, rankCounts: [1, 1] });
    expect(standings[1]).toMatchObject({ participantId: "p2", points: 5, rankCounts: [1, 1] });
  });

  it("breaks ties using rank counts stored in the rankCounts field", () => {
    const storedBallots = [
      { voterId: "v1", rankedParticipantIds: ["p1", "p2"] },
      { voterId: "v2", rankedParticipantIds: ["p2", "p1"] },
      { voterId: "v3", rankedParticipantIds: ["p1", "p2"] },
    ];
    // p1: 2 first-rank + 1 second-rank = 3+2+3 = 8 pts
    // p2: 1 first-rank + 2 second-rank = 2+3+2 = 7 pts? No wait...
    // maxRankedPicks=2: rank1=2pts, rank2=1pt
    // p1: v1(2)+v2(1)+v3(2)=5; p2: v1(1)+v2(2)+v3(1)=4
    const standings = computeShowcaseStandings(storedBallots, 2, baseTimestamps);

    expect(standings[0].participantId).toBe("p1");
    expect(standings[0].rankCounts).toEqual([2, 1]); // 2 first-rank votes, 1 second-rank vote
    expect(standings[1].participantId).toBe("p2");
  });
});
