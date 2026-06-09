import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA = z.object({
  participationScope: z.enum(["public", "invite-only"]),
  listenerScope: z.enum(["public", "invite-only"]),
  voterScope: z.enum(["public-authenticated", "invite-only-authenticated"]),
  isAuthenticated: z.boolean(),
  isInvited: z.boolean(),
  isParticipantInShowcase: z.boolean(),
});

export const POLICY_SUBMIT_ENTRY_DATA_SCHEMA = z.object({
  canSubmitEntry: z.literal(true),
});

export const POLICY_SUBMIT_ENTRY_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  POLICY_SUBMIT_ENTRY_DATA_SCHEMA,
);

export type PolicySubmitEntryRequest = z.infer<typeof POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA>;
export type PolicySubmitEntryData = z.infer<typeof POLICY_SUBMIT_ENTRY_DATA_SCHEMA>;
export type PolicySubmitEntryResponse = ApiRouteResponse<PolicySubmitEntryData>;
