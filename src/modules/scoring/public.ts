import type { RankedBallot } from "@/src/modules/ballots/public";

export type ParticipantScore = {
  participantId: string;
  points: number;
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
