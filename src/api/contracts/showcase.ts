import { z } from "zod";
import { apiSuccessResponseSchema, type ApiRouteResponse } from "@/src/api/contracts/common";

export const SHOWCASE_UPDATE_REQUEST_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  updates: z.object({
    voterScope: z.enum(["public-authenticated", "invite-only-authenticated"]).optional(),
    listenerScope: z.enum(["public", "invite-only"]).optional(),
    blindJudgingEnabled: z.boolean().optional(),
    maxRankedPicks: z.number().int().positive().optional(),
  }),
});

export const SHOWCASE_UPDATE_DATA_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  updated: z.record(z.boolean()),
});

export const SHOWCASE_UPDATE_SUCCESS_RESPONSE_SCHEMA = apiSuccessResponseSchema(
  SHOWCASE_UPDATE_DATA_SCHEMA,
);

export type ShowcaseUpdateRequest = z.infer<typeof SHOWCASE_UPDATE_REQUEST_SCHEMA>;
export type ShowcaseUpdateData = z.infer<typeof SHOWCASE_UPDATE_DATA_SCHEMA>;
export type ShowcaseUpdateResponse = ApiRouteResponse<ShowcaseUpdateData>;
