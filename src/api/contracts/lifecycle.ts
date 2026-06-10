import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const SHOWCASE_LIFECYCLE_STATE_SCHEMA = z.enum([
  "creation",
  "submission-open",
  "voting-open",
  "finalized",
]);

export const LIFECYCLE_TRANSITION_REQUEST_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  nextState: SHOWCASE_LIFECYCLE_STATE_SCHEMA,
  actorUserId: z.string().min(1).optional(),
  reason: z.string().trim().min(1).max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const LIFECYCLE_TRANSITION_DATA_SCHEMA = z.object({
  previousState: SHOWCASE_LIFECYCLE_STATE_SCHEMA,
  nextState: SHOWCASE_LIFECYCLE_STATE_SCHEMA,
  transitionAuditEventId: z.string().uuid(),
});

export const LIFECYCLE_TRANSITION_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  LIFECYCLE_TRANSITION_DATA_SCHEMA,
);

export type LifecycleTransitionRequest = z.infer<typeof LIFECYCLE_TRANSITION_REQUEST_SCHEMA>;
export type LifecycleTransitionData = z.infer<typeof LIFECYCLE_TRANSITION_DATA_SCHEMA>;
export type LifecycleTransitionResponse = ApiRouteResponse<LifecycleTransitionData>;
