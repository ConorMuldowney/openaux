import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const VISIBILITY_PARTICIPANT_IDENTITY_REQUEST_SCHEMA = z.object({
  isBlindJudgingEnabled: z.boolean(),
  lifecycleState: z.enum(["creation", "submission-open", "voting-open", "finalized"]),
});

export const VISIBILITY_PARTICIPANT_IDENTITY_DATA_SCHEMA = z.object({
  shouldRevealParticipantIdentity: z.boolean(),
});

export const VISIBILITY_PARTICIPANT_IDENTITY_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  VISIBILITY_PARTICIPANT_IDENTITY_DATA_SCHEMA,
);

export type VisibilityParticipantIdentityRequest = z.infer<
  typeof VISIBILITY_PARTICIPANT_IDENTITY_REQUEST_SCHEMA
>;
export type VisibilityParticipantIdentityData = z.infer<
  typeof VISIBILITY_PARTICIPANT_IDENTITY_DATA_SCHEMA
>;
export type VisibilityParticipantIdentityResponse = ApiRouteResponse<VisibilityParticipantIdentityData>;
