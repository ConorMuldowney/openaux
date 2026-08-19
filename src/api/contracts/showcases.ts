import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const PARTICIPATION_SCOPE_SCHEMA = z.enum(["public", "invite-only"]);
export const LISTENER_SCOPE_SCHEMA = z.enum(["public", "invite-only"]);
export const VOTER_SCOPE_SCHEMA = z.enum([
  "public-authenticated",
  "invite-only-authenticated",
]);

const UTC_DATE_TIME_SCHEMA = z
  .string()
  .datetime({ offset: true })
  .refine((value) => value.endsWith("Z"), {
    message: "Timestamp must be UTC and end with 'Z'.",
  })
  .transform((value) => new Date(value));

const SHOWCASE_SCHEDULE_SCHEMA = z
  .object({
    submissionOpensAt: UTC_DATE_TIME_SCHEMA,
    submissionClosesAt: UTC_DATE_TIME_SCHEMA,
    votingOpensAt: UTC_DATE_TIME_SCHEMA,
    votingClosesAt: UTC_DATE_TIME_SCHEMA,
  })
  .superRefine((value, ctx) => {
    if (value.submissionClosesAt <= value.submissionOpensAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["submissionClosesAt"],
        message: "submissionClosesAt must be later than submissionOpensAt.",
      });
    }

    if (value.votingOpensAt < value.submissionClosesAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["votingOpensAt"],
        message: "votingOpensAt must be at or after submissionClosesAt.",
      });
    }

    if (value.votingClosesAt <= value.votingOpensAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["votingClosesAt"],
        message: "votingClosesAt must be later than votingOpensAt.",
      });
    }
  });

const SHOWCASE_SETTINGS_SCHEMA = z.object({
  title: z.string().trim().min(3).max(120),
  participationScope: PARTICIPATION_SCOPE_SCHEMA,
  listenerScope: LISTENER_SCOPE_SCHEMA,
  voterScope: VOTER_SCOPE_SCHEMA,
  blindJudgingEnabled: z.boolean(),
  maxRankedPicks: z.number().int().min(1).max(100),
  requiredSampleIds: z.array(z.string().trim().min(1)).max(50),
});

export const SHOWCASE_CREATE_REQUEST_SCHEMA = SHOWCASE_SETTINGS_SCHEMA.and(
  SHOWCASE_SCHEDULE_SCHEMA,
).superRefine((value, ctx) => {
  if (
    value.listenerScope === "invite-only" &&
    value.voterScope === "public-authenticated"
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["voterScope"],
      message: "voterScope must be invite-only-authenticated when listenerScope is invite-only.",
    });
  }

  if (new Set(value.requiredSampleIds).size !== value.requiredSampleIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["requiredSampleIds"],
      message: "requiredSampleIds must not contain duplicates.",
    });
  }
});

export const SHOWCASE_UPDATE_REQUEST_SCHEMA = SHOWCASE_SETTINGS_SCHEMA.partial().superRefine(
  (value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body"],
        message: "At least one field must be provided for update.",
      });
    }

    if (value.requiredSampleIds) {
      const normalizedIds = value.requiredSampleIds;
      if (new Set(normalizedIds).size !== normalizedIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiredSampleIds"],
          message: "requiredSampleIds must not contain duplicates.",
        });
      }
    }
  },
);

const HOST_CONTROL_ACTION_SCHEMA = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel-showcase"),
    reason: z.string().trim().min(1).max(500).optional(),
  }),
  z.object({
    action: z.literal("extend-submission-close"),
    submissionClosesAt: UTC_DATE_TIME_SCHEMA,
    reason: z.string().trim().min(1).max(500).optional(),
  }),
  z.object({
    action: z.literal("extend-voting-close"),
    votingClosesAt: UTC_DATE_TIME_SCHEMA,
    reason: z.string().trim().min(1).max(500).optional(),
  }),
]);

export const SHOWCASE_HOST_CONTROL_REQUEST_SCHEMA = z.object({
  hostControl: HOST_CONTROL_ACTION_SCHEMA,
});

export const SHOWCASE_UPDATE_OR_HOST_CONTROL_REQUEST_SCHEMA = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    participationScope: PARTICIPATION_SCOPE_SCHEMA.optional(),
    listenerScope: LISTENER_SCOPE_SCHEMA.optional(),
    voterScope: VOTER_SCOPE_SCHEMA.optional(),
    blindJudgingEnabled: z.boolean().optional(),
    maxRankedPicks: z.number().int().min(1).max(100).optional(),
    requiredSampleIds: z.array(z.string().trim().min(1)).max(50).optional(),
    hostControl: HOST_CONTROL_ACTION_SCHEMA.optional(),
  })
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["body"],
        message: "At least one field must be provided for update.",
      });
      return;
    }

    if (value.requiredSampleIds) {
      if (new Set(value.requiredSampleIds).size !== value.requiredSampleIds.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["requiredSampleIds"],
          message: "requiredSampleIds must not contain duplicates.",
        });
      }
    }

    if (
      value.listenerScope === "invite-only" &&
      value.voterScope === "public-authenticated"
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["voterScope"],
        message: "voterScope must be invite-only-authenticated when listenerScope is invite-only.",
      });
    }

    if (value.hostControl) {
      const hasSettingsField =
        value.title !== undefined ||
        value.participationScope !== undefined ||
        value.listenerScope !== undefined ||
        value.voterScope !== undefined ||
        value.blindJudgingEnabled !== undefined ||
        value.maxRankedPicks !== undefined ||
        value.requiredSampleIds !== undefined;

      if (hasSettingsField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hostControl"],
          message: "hostControl requests must not be combined with settings updates.",
        });
      }
    }
  });

export const SHOWCASE_DETAIL_DATA_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  hostUserId: z.string().min(1),
  lifecycleState: z.enum([
    "creation",
    "submission-open",
    "voting-open",
    "finalized",
    "voided",
    "canceled",
  ]),
  participationScope: PARTICIPATION_SCOPE_SCHEMA,
  listenerScope: LISTENER_SCOPE_SCHEMA,
  voterScope: VOTER_SCOPE_SCHEMA,
  blindJudgingEnabled: z.boolean(),
  maxRankedPicks: z.number().int().min(1),
  requiredSampleIds: z.array(z.string()),
  submissionOpensAt: z.coerce.date().nullable(),
  submissionClosesAt: z.coerce.date().nullable(),
  votingOpensAt: z.coerce.date().nullable(),
  votingClosesAt: z.coerce.date().nullable(),
  finalizedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const SHOWCASE_CREATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_DETAIL_DATA_SCHEMA,
);

export const SHOWCASE_UPDATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_DETAIL_DATA_SCHEMA,
);

export const SHOWCASE_DETAIL_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_DETAIL_DATA_SCHEMA,
);

export const SHOWCASE_LIST_ITEM_SCHEMA = SHOWCASE_DETAIL_DATA_SCHEMA;

export const SHOWCASE_LIST_DATA_SCHEMA = z.object({
  showcases: z.array(SHOWCASE_LIST_ITEM_SCHEMA),
});

export const SHOWCASE_LIST_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_LIST_DATA_SCHEMA,
);

export const SHOWCASE_READ_ENTRY_SCHEMA = z.object({
  entryId: z.string().uuid(),
  participantId: z.string().uuid().nullable(),
  participantAlias: z.string().min(1).nullable(),
  storageKey: z.string().min(1),
  submittedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isValidForRequiredSamples: z.boolean(),
});

export const SHOWCASE_READ_ENTRIES_DATA_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  lifecycleState: SHOWCASE_DETAIL_DATA_SCHEMA.shape.lifecycleState,
  blindJudgingEnabled: z.boolean(),
  entries: z.array(SHOWCASE_READ_ENTRY_SCHEMA),
});

export const SHOWCASE_READ_ENTRIES_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_READ_ENTRIES_DATA_SCHEMA,
);

export const SHOWCASE_ENTRY_UPLOAD_URL_REQUEST_SCHEMA = z.object({
  contentType: z.enum([
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/aac",
    "audio/mp4",
  ]),
});

export const SHOWCASE_ENTRY_UPLOAD_URL_DATA_SCHEMA = z.object({
  uploadUrl: z.string().url(),
  storageKey: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export const SHOWCASE_ENTRY_UPLOAD_URL_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_ENTRY_UPLOAD_URL_DATA_SCHEMA,
);

export type ShowcaseEntryUploadUrlRequest = z.infer<
  typeof SHOWCASE_ENTRY_UPLOAD_URL_REQUEST_SCHEMA
>;
export type ShowcaseEntryUploadUrlData = z.infer<typeof SHOWCASE_ENTRY_UPLOAD_URL_DATA_SCHEMA>;
export type ShowcaseEntryUploadUrlResponse = ApiRouteResponse<ShowcaseEntryUploadUrlData>;

export const SHOWCASE_SAMPLE_UPLOAD_URL_REQUEST_SCHEMA = z.object({
  contentType: z.enum([
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "audio/flac",
    "audio/aac",
    "audio/mp4",
  ]),
});

export const SHOWCASE_SAMPLE_UPLOAD_URL_DATA_SCHEMA = z.object({
  uploadUrl: z.string().url(),
  storageKey: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});

export const SHOWCASE_SAMPLE_UPLOAD_URL_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_SAMPLE_UPLOAD_URL_DATA_SCHEMA,
);

export type ShowcaseSampleUploadUrlRequest = z.infer<
  typeof SHOWCASE_SAMPLE_UPLOAD_URL_REQUEST_SCHEMA
>;
export type ShowcaseSampleUploadUrlData = z.infer<typeof SHOWCASE_SAMPLE_UPLOAD_URL_DATA_SCHEMA>;
export type ShowcaseSampleUploadUrlResponse = ApiRouteResponse<ShowcaseSampleUploadUrlData>;

export const SHOWCASE_SAMPLE_DOWNLOAD_URL_REQUEST_SCHEMA = z.object({
  storageKey: z.string().min(1),
});

export const SHOWCASE_SAMPLE_DOWNLOAD_URL_DATA_SCHEMA = z.object({
  downloadUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});

export const SHOWCASE_SAMPLE_DOWNLOAD_URL_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_SAMPLE_DOWNLOAD_URL_DATA_SCHEMA,
);

export type ShowcaseSampleDownloadUrlRequest = z.infer<
  typeof SHOWCASE_SAMPLE_DOWNLOAD_URL_REQUEST_SCHEMA
>;
export type ShowcaseSampleDownloadUrlData = z.infer<
  typeof SHOWCASE_SAMPLE_DOWNLOAD_URL_DATA_SCHEMA
>;
export type ShowcaseSampleDownloadUrlResponse = ApiRouteResponse<ShowcaseSampleDownloadUrlData>;

export const SHOWCASE_CONFIRM_ENTRY_REQUEST_SCHEMA = z.object({
  storageKey: z.string().min(1),
  usedSampleIds: z.array(z.string().trim().min(1)),
});

export const SHOWCASE_CONFIRM_ENTRY_DATA_SCHEMA = z.object({
  entryId: z.string().uuid(),
  storageKey: z.string().min(1),
  submittedAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  isValidForRequiredSamples: z.boolean(),
});

export const SHOWCASE_CONFIRM_ENTRY_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_CONFIRM_ENTRY_DATA_SCHEMA,
);

export type ShowcaseConfirmEntryRequest = z.infer<typeof SHOWCASE_CONFIRM_ENTRY_REQUEST_SCHEMA>;
export type ShowcaseConfirmEntryData = z.infer<typeof SHOWCASE_CONFIRM_ENTRY_DATA_SCHEMA>;
export type ShowcaseConfirmEntryResponse = ApiRouteResponse<ShowcaseConfirmEntryData>;

export const SHOWCASE_RESULT_STANDING_SCHEMA = z.object({
  rank: z.number().int().positive(),
  participantId: z.string().uuid(),
  points: z.number().int(),
  rankCounts: z.array(z.number().int()),
});

export const SHOWCASE_READ_RESULTS_DATA_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  publishedAt: z.string().datetime(),
  standings: z.array(SHOWCASE_RESULT_STANDING_SCHEMA),
});

export const SHOWCASE_READ_RESULTS_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_READ_RESULTS_DATA_SCHEMA,
);

export type ShowcaseCreateRequest = z.infer<typeof SHOWCASE_CREATE_REQUEST_SCHEMA>;
export type ShowcaseUpdateRequest = z.infer<typeof SHOWCASE_UPDATE_REQUEST_SCHEMA>;
export type ShowcaseHostControlRequest = z.infer<typeof SHOWCASE_HOST_CONTROL_REQUEST_SCHEMA>;
export type ShowcaseUpdateOrHostControlRequest = z.infer<
  typeof SHOWCASE_UPDATE_OR_HOST_CONTROL_REQUEST_SCHEMA
>;
export type ShowcaseDetailData = z.infer<typeof SHOWCASE_DETAIL_DATA_SCHEMA>;
export type ShowcaseCreateResponse = ApiRouteResponse<ShowcaseDetailData>;
export type ShowcaseUpdateResponse = ApiRouteResponse<ShowcaseDetailData>;
export type ShowcaseDetailResponse = ApiRouteResponse<ShowcaseDetailData>;
export type ShowcaseListData = z.infer<typeof SHOWCASE_LIST_DATA_SCHEMA>;
export type ShowcaseListResponse = ApiRouteResponse<ShowcaseListData>;
export type ShowcaseReadEntriesData = z.infer<typeof SHOWCASE_READ_ENTRIES_DATA_SCHEMA>;
export type ShowcaseReadEntriesResponse = ApiRouteResponse<ShowcaseReadEntriesData>;
export type ShowcaseReadResultsData = z.infer<typeof SHOWCASE_READ_RESULTS_DATA_SCHEMA>;
export type ShowcaseReadResultsResponse = ApiRouteResponse<ShowcaseReadResultsData>;
