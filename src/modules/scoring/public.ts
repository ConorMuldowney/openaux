import type { RankedBallot } from "@/src/modules/ballots/public";

export type ParticipantScore = {
  participantId: string;
  points: number;
};

export type TieBreakCandidate = {
  participantId: string;
  points: number;
  rankCounts: number[];
  submittedAt: Date;
};

export function scoreRankedBallot(
  rankedBallot: RankedBallot,
  maxRankedPicks: number,
): ParticipantScore[] {
  return rankedBallot.picks.map((pick) => ({
    participantId: pick.participantId,
    points: maxRankedPicks - pick.rank + 1,
  }));
}

export function rankParticipantsWithTieBreak(
  candidates: TieBreakCandidate[],
): TieBreakCandidate[] {
  return [...candidates].sort((left, right) => {
    if (left.points !== right.points) {
      return right.points - left.points;
    }

    const maxRankDepth = Math.max(left.rankCounts.length, right.rankCounts.length);
    for (let index = 0; index < maxRankDepth; index += 1) {
      const leftCount = left.rankCounts[index] ?? 0;
      const rightCount = right.rankCounts[index] ?? 0;

      if (leftCount !== rightCount) {
        return rightCount - leftCount;
      }
    }

    if (left.submittedAt.getTime() !== right.submittedAt.getTime()) {
      return left.submittedAt.getTime() - right.submittedAt.getTime();
    }

    return left.participantId.localeCompare(right.participantId);
  });
}
