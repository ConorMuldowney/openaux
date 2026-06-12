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

export type StoredBallot = {
  voterId: string;
  rankedParticipantIds: string[];
};

export type EntryTimestamp = {
  participantId: string;
  submittedAt: Date;
};

export type FinalStanding = {
  rank: number;
  participantId: string;
  points: number;
  rankCounts: number[];
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

export function computeShowcaseStandings(
  storedBallots: StoredBallot[],
  maxRankedPicks: number,
  entryTimestamps: EntryTimestamp[],
): FinalStanding[] {
  const allowedParticipantIds = new Set(entryTimestamps.map((entry) => entry.participantId));
  const pointMap = new Map<string, number>();
  const rankCountsMap = new Map<string, number[]>();

  for (const stored of storedBallots) {
    const compressedRankedParticipantIds = stored.rankedParticipantIds.filter((participantId) =>
      allowedParticipantIds.has(participantId),
    );

    const ballot: RankedBallot = {
      voterId: stored.voterId,
      picks: compressedRankedParticipantIds.map((participantId, index) => ({
        rank: index + 1,
        participantId,
      })),
    };

    const scores = scoreRankedBallot(ballot, maxRankedPicks);
    for (const score of scores) {
      pointMap.set(score.participantId, (pointMap.get(score.participantId) ?? 0) + score.points);
    }

    for (const pick of ballot.picks) {
      const counts = rankCountsMap.get(pick.participantId) ?? [];
      const rankIndex = pick.rank - 1;
      while (counts.length <= rankIndex) {
        counts.push(0);
      }
      counts[rankIndex] += 1;
      rankCountsMap.set(pick.participantId, counts);
    }
  }

  const timestampMap = new Map<string, Date>(
    entryTimestamps.map((e) => [e.participantId, e.submittedAt]),
  );

  const allParticipantIds = new Set<string>([
    ...entryTimestamps.map((e) => e.participantId),
  ]);

  const candidates: TieBreakCandidate[] = [...allParticipantIds].map((participantId) => ({
    participantId,
    points: pointMap.get(participantId) ?? 0,
    rankCounts: rankCountsMap.get(participantId) ?? [],
    submittedAt: timestampMap.get(participantId) ?? new Date(0),
  }));

  const sorted = rankParticipantsWithTieBreak(candidates);

  return sorted.map((candidate, index) => ({
    rank: index + 1,
    participantId: candidate.participantId,
    points: candidate.points,
    rankCounts: candidate.rankCounts,
  }));
}
