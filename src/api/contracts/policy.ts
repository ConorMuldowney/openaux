import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const POLICY_DENIAL_REASON_SCHEMA = z.enum([
  "authentication-required",
  "verified-email-required",
  "host-membership-required",
  "invite-required",
  "participant-cannot-vote",
]);

export type PolicyDenialReason = z.infer<typeof POLICY_DENIAL_REASON_SCHEMA>;

export const POLICY_HOST_CREATE_REQUEST_SCHEMA = z.object({
  isAuthenticated: z.boolean(),
  isVerifiedEmail: z.boolean(),
});

export const POLICY_HOST_CREATE_DATA_SCHEMA = z.object({
  canCreateHost: z.literal(true),
});

export const POLICY_HOST_CREATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  POLICY_HOST_CREATE_DATA_SCHEMA,
);

export type PolicyHostCreateRequest = z.infer<typeof POLICY_HOST_CREATE_REQUEST_SCHEMA>;
export type PolicyHostCreateData = z.infer<typeof POLICY_HOST_CREATE_DATA_SCHEMA>;
export type PolicyHostCreateResponse = ApiRouteResponse<PolicyHostCreateData>;

export const POLICY_HOST_UPDATE_REQUEST_SCHEMA = z.object({
  isAuthenticated: z.boolean(),
  isVerifiedEmail: z.boolean(),
  isHostOfShowcase: z.boolean(),
});

export const POLICY_HOST_UPDATE_DATA_SCHEMA = z.object({
  canUpdateHost: z.literal(true),
});

export const POLICY_HOST_UPDATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  POLICY_HOST_UPDATE_DATA_SCHEMA,
);

export type PolicyHostUpdateRequest = z.infer<typeof POLICY_HOST_UPDATE_REQUEST_SCHEMA>;
export type PolicyHostUpdateData = z.infer<typeof POLICY_HOST_UPDATE_DATA_SCHEMA>;
export type PolicyHostUpdateResponse = ApiRouteResponse<PolicyHostUpdateData>;

export const POLICY_INVITE_ACCEPT_REQUEST_SCHEMA = z.object({
  isAuthenticated: z.boolean(),
});

export const POLICY_INVITE_ACCEPT_DATA_SCHEMA = z.object({
  canAcceptInvite: z.literal(true),
});

export const POLICY_INVITE_ACCEPT_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  POLICY_INVITE_ACCEPT_DATA_SCHEMA,
);

export type PolicyInviteAcceptRequest = z.infer<typeof POLICY_INVITE_ACCEPT_REQUEST_SCHEMA>;
export type PolicyInviteAcceptData = z.infer<typeof POLICY_INVITE_ACCEPT_DATA_SCHEMA>;
export type PolicyInviteAcceptResponse = ApiRouteResponse<PolicyInviteAcceptData>;

export const POLICY_SUBMIT_ENTRY_REQUEST_SCHEMA = z.object({
  participationScope: z.enum(["public", "invite-only"]),
  isAuthenticated: z.boolean(),
  isInvited: z.boolean(),
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

export const POLICY_LISTEN_REQUEST_SCHEMA = z.object({
  listenerScope: z.enum(["public", "invite-only"]),
  isInvited: z.boolean(),
});

export const POLICY_LISTEN_DATA_SCHEMA = z.object({
  canListen: z.literal(true),
});

export const POLICY_LISTEN_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  POLICY_LISTEN_DATA_SCHEMA,
);

export type PolicyListenRequest = z.infer<typeof POLICY_LISTEN_REQUEST_SCHEMA>;
export type PolicyListenData = z.infer<typeof POLICY_LISTEN_DATA_SCHEMA>;
export type PolicyListenResponse = ApiRouteResponse<PolicyListenData>;

export const POLICY_VOTE_REQUEST_SCHEMA = z.object({
  voterScope: z.enum(["public-authenticated", "invite-only-authenticated"]),
  isAuthenticated: z.boolean(),
  isVerifiedEmail: z.boolean(),
  isInvited: z.boolean(),
  isParticipantInShowcase: z.boolean(),
});

export const POLICY_VOTE_DATA_SCHEMA = z.object({
  canVote: z.literal(true),
});

export const POLICY_VOTE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(POLICY_VOTE_DATA_SCHEMA);

export type PolicyVoteRequest = z.infer<typeof POLICY_VOTE_REQUEST_SCHEMA>;
export type PolicyVoteData = z.infer<typeof POLICY_VOTE_DATA_SCHEMA>;
export type PolicyVoteResponse = ApiRouteResponse<PolicyVoteData>;
