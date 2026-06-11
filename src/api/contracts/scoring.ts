import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";
import { RANKED_BALLOT_SCHEMA } from "@/src/api/contracts/ballots";

export const SCORING_RANKED_BALLOT_REQUEST_SCHEMA = z.object({
  rankedBallot: RANKED_BALLOT_SCHEMA,
  maxRankedPicks: z.number().int().positive(),
});

export const PARTICIPANT_SCORE_SCHEMA = z.object({
  participantId: z.string().min(1),
  points: z.number().int(),
});

export const SCORING_RANKED_BALLOT_DATA_SCHEMA = z.object({
  scores: z.array(PARTICIPANT_SCORE_SCHEMA),
});

export const SCORING_RANKED_BALLOT_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SCORING_RANKED_BALLOT_DATA_SCHEMA,
);

export type ScoringRankedBallotRequest = z.infer<typeof SCORING_RANKED_BALLOT_REQUEST_SCHEMA>;
export type ScoringRankedBallotData = z.infer<typeof SCORING_RANKED_BALLOT_DATA_SCHEMA>;
export type ScoringRankedBallotResponse = ApiRouteResponse<ScoringRankedBallotData>;

export const SCORING_FINAL_STANDINGS_REQUEST_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
});

export const FINAL_STANDING_SCHEMA = z.object({
  rank: z.number().int().positive(),
  participantId: z.string().min(1),
  points: z.number().int(),
  rankCounts: z.array(z.number().int()),
});

export const SCORING_FINAL_STANDINGS_DATA_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  publishedAt: z.string().datetime(),
  standings: z.array(FINAL_STANDING_SCHEMA),
});

export const SCORING_FINAL_STANDINGS_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SCORING_FINAL_STANDINGS_DATA_SCHEMA,
);

export type ScoringFinalStandingsRequest = z.infer<typeof SCORING_FINAL_STANDINGS_REQUEST_SCHEMA>;
export type ScoringFinalStandingsData = z.infer<typeof SCORING_FINAL_STANDINGS_DATA_SCHEMA>;
export type ScoringFinalStandingsResponse = ApiRouteResponse<ScoringFinalStandingsData>;
