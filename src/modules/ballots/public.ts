export type RankedPick = {
  rank: number;
  participantId: string;
};

export type RankedBallot = {
  voterId: string;
  picks: RankedPick[];
};

export type RankedBallotValidationReason =
  | "too-many-picks"
  | "duplicate-participant"
  | "duplicate-rank"
  | "rank-out-of-range"
  | "non-contiguous-ranks";

export type RankedBallotValidationResult =
  | { isValid: true }
  | { isValid: false; reason: RankedBallotValidationReason };

export function validateRankedBallot(
  rankedBallot: RankedBallot,
  maxRankedPicks: number,
): RankedBallotValidationResult {
  if (rankedBallot.picks.length > maxRankedPicks) {
    return { isValid: false, reason: "too-many-picks" };
  }

  const participantIds = rankedBallot.picks.map((pick) => pick.participantId);
  if (new Set(participantIds).size !== participantIds.length) {
    return { isValid: false, reason: "duplicate-participant" };
  }

  const ranks = rankedBallot.picks.map((pick) => pick.rank);
  if (new Set(ranks).size !== ranks.length) {
    return { isValid: false, reason: "duplicate-rank" };
  }

  if (ranks.some((rank) => rank > maxRankedPicks)) {
    return { isValid: false, reason: "rank-out-of-range" };
  }

  const sortedRanks = [...ranks].sort((left, right) => left - right);
  for (let index = 0; index < sortedRanks.length; index += 1) {
    if (sortedRanks[index] !== index + 1) {
      return { isValid: false, reason: "non-contiguous-ranks" };
    }
  }

  return { isValid: true };
}
