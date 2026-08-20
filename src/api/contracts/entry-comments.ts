import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";
import { MAX_ENTRY_COMMENT_TIMESTAMP_SECONDS } from "@/src/modules/comments/public";

export const ENTRY_COMMENT_CREATE_REQUEST_SCHEMA = z.object({
  timestampSeconds: z.number().finite().min(0).max(MAX_ENTRY_COMMENT_TIMESTAMP_SECONDS),
  body: z.string().trim().min(1).max(1000),
});

export const ENTRY_COMMENT_SCHEMA = z.object({
  id: z.string().uuid(),
  timestampSeconds: z.number(),
  body: z.string(),
  authorUserId: z.string().nullable(),
  authorAlias: z.string().nullable(),
  createdAt: z.coerce.date(),
  isOwnComment: z.boolean(),
});

export type EntryComment = z.infer<typeof ENTRY_COMMENT_SCHEMA>;

export const ENTRY_COMMENTS_LIST_DATA_SCHEMA = z.object({
  entryId: z.string().uuid(),
  comments: z.array(ENTRY_COMMENT_SCHEMA),
});

export type EntryCommentsListData = z.infer<typeof ENTRY_COMMENTS_LIST_DATA_SCHEMA>;
export type EntryCommentsListResponse = ApiRouteResponse<EntryCommentsListData>;
export const ENTRY_COMMENTS_LIST_RESPONSE_SCHEMA = z.union([
  apiSuccessResponseSchema(ENTRY_COMMENTS_LIST_DATA_SCHEMA),
  z.object({ ok: z.literal(false) }),
]);

export type EntryCommentCreateData = EntryComment;
export type EntryCommentCreateResponse = ApiRouteResponse<EntryCommentCreateData>;
