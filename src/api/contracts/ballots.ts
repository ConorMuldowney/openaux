import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const RANKED_PICK_SCHEMA = z.object({
  rank: z.number().int().positive(),
  participantId: z.string().min(1),
});

export const RANKED_BALLOT_SCHEMA = z.object({
  voterId: z.string().min(1),
  picks: z.array(RANKED_PICK_SCHEMA),
});

export const BALLOTS_VALIDATE_REQUEST_SCHEMA = z.object({
  rankedBallot: RANKED_BALLOT_SCHEMA,
  maxRankedPicks: z.number().int().positive(),
});

export const BALLOTS_VALIDATE_DATA_SCHEMA = z.object({
  isValid: z.boolean(),
  reason: z
    .enum([
      "too-many-picks",
      "duplicate-participant",
      "duplicate-rank",
      "rank-out-of-range",
      "non-contiguous-ranks",
    ])
    .optional(),
});

export const BALLOTS_VALIDATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  BALLOTS_VALIDATE_DATA_SCHEMA,
);

export type BallotsValidateRequest = z.infer<typeof BALLOTS_VALIDATE_REQUEST_SCHEMA>;
export type BallotsValidateData = z.infer<typeof BALLOTS_VALIDATE_DATA_SCHEMA>;
export type BallotsValidateResponse = ApiRouteResponse<BallotsValidateData>;
