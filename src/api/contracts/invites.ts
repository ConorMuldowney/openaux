import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const INVITE_SCOPE_SCHEMA = z.enum(["participation", "listener", "voter"]);

export type InviteScope = z.infer<typeof INVITE_SCOPE_SCHEMA>;

export const INVITE_ISSUE_REQUEST_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  scope: INVITE_SCOPE_SCHEMA,
  invitedEmail: z.string().trim().toLowerCase().email().optional(),
  expiresAt: z.coerce.date().optional(),
});

export const INVITE_ISSUE_DATA_SCHEMA = z.object({
  inviteId: z.string().uuid(),
  showcaseId: z.string().uuid(),
  scope: INVITE_SCOPE_SCHEMA,
  token: z.string().min(1),
  expiresAt: z.coerce.date().nullable(),
});

export const INVITE_ISSUE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  INVITE_ISSUE_DATA_SCHEMA,
);

export type InviteIssueRequest = z.infer<typeof INVITE_ISSUE_REQUEST_SCHEMA>;
export type InviteIssueData = z.infer<typeof INVITE_ISSUE_DATA_SCHEMA>;
export type InviteIssueResponse = ApiRouteResponse<InviteIssueData>;

export const INVITE_ACCEPT_REQUEST_SCHEMA = z.object({
  token: z.string().trim().min(1),
});

export const INVITE_ACCEPT_DATA_SCHEMA = z.object({
  inviteId: z.string().uuid(),
  showcaseId: z.string().uuid(),
  scope: INVITE_SCOPE_SCHEMA,
  acceptedByUserId: z.string().min(1),
  acceptedAt: z.coerce.date(),
  inviteAcceptanceAuditEventId: z.string().uuid(),
});

export const INVITE_ACCEPT_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  INVITE_ACCEPT_DATA_SCHEMA,
);

export type InviteAcceptRequest = z.infer<typeof INVITE_ACCEPT_REQUEST_SCHEMA>;
export type InviteAcceptData = z.infer<typeof INVITE_ACCEPT_DATA_SCHEMA>;
export type InviteAcceptResponse = ApiRouteResponse<InviteAcceptData>;
