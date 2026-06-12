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

export type ShowcaseCreateRequest = z.infer<typeof SHOWCASE_CREATE_REQUEST_SCHEMA>;
export type ShowcaseUpdateRequest = z.infer<typeof SHOWCASE_UPDATE_REQUEST_SCHEMA>;
export type ShowcaseDetailData = z.infer<typeof SHOWCASE_DETAIL_DATA_SCHEMA>;
export type ShowcaseCreateResponse = ApiRouteResponse<ShowcaseDetailData>;
export type ShowcaseUpdateResponse = ApiRouteResponse<ShowcaseDetailData>;
export type ShowcaseDetailResponse = ApiRouteResponse<ShowcaseDetailData>;
