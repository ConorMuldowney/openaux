import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const SHOWCASE_LIFECYCLE_STATE_SCHEMA = z.enum([
  "creation",
  "submission-open",
  "voting-open",
  "finalized",
]);

export const LIFECYCLE_TRANSITION_REQUEST_SCHEMA = z.object({
  currentState: SHOWCASE_LIFECYCLE_STATE_SCHEMA,
  nextState: SHOWCASE_LIFECYCLE_STATE_SCHEMA,
});

export const LIFECYCLE_TRANSITION_DATA_SCHEMA = z.object({
  canTransition: z.boolean(),
});

export const LIFECYCLE_TRANSITION_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  LIFECYCLE_TRANSITION_DATA_SCHEMA,
);

export type LifecycleTransitionRequest = z.infer<typeof LIFECYCLE_TRANSITION_REQUEST_SCHEMA>;
export type LifecycleTransitionData = z.infer<typeof LIFECYCLE_TRANSITION_DATA_SCHEMA>;
export type LifecycleTransitionResponse = ApiRouteResponse<LifecycleTransitionData>;
