export type RankedPick = {
  rank: number;
  participantId: string;
};

export type RankedBallot = {
  voterId: string;
  picks: RankedPick[];
};

export function validateRankedBallot(
  rankedBallot: RankedBallot,
  maxRankedPicks: number,
): { isValid: boolean; reason?: string } {
  if (rankedBallot.picks.length > maxRankedPicks) {
    return { isValid: false, reason: "too-many-picks" };
  }

  const participantIds = rankedBallot.picks.map((pick) => pick.participantId);
  if (new Set(participantIds).size !== participantIds.length) {
    return { isValid: false, reason: "duplicate-participant" };
  }

  const sortedRanks = rankedBallot.picks.map((pick) => pick.rank).sort((left, right) => left - right);
  for (let index = 0; index < sortedRanks.length; index += 1) {
    if (sortedRanks[index] !== index + 1) {
      return { isValid: false, reason: "non-contiguous-ranks" };
    }
  }

  return { isValid: true };
}
