import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const SUBMISSIONS_REQUIRED_SAMPLE_REQUEST_SCHEMA = z.object({
  participantId: z.string().min(1),
  showcaseId: z.string().min(1),
  requiredSampleIds: z.array(z.string().min(1)),
  usedSampleIds: z.array(z.string().min(1)),
});

export const SUBMISSIONS_REQUIRED_SAMPLE_DATA_SCHEMA = z.object({
  isEntryValid: z.boolean(),
});

export const SUBMISSIONS_REQUIRED_SAMPLE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SUBMISSIONS_REQUIRED_SAMPLE_DATA_SCHEMA,
);

export type SubmissionsRequiredSampleRequest = z.infer<
  typeof SUBMISSIONS_REQUIRED_SAMPLE_REQUEST_SCHEMA
>;
export type SubmissionsRequiredSampleData = z.infer<typeof SUBMISSIONS_REQUIRED_SAMPLE_DATA_SCHEMA>;
export type SubmissionsRequiredSampleResponse = ApiRouteResponse<SubmissionsRequiredSampleData>;
