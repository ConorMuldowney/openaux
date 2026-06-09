import { z } from "zod";

export const API_ERROR_CODE_SCHEMA = z.enum([
  "validation-error",
  "policy-denied",
  "state-invalid",
]);

export type ApiErrorCode = z.infer<typeof API_ERROR_CODE_SCHEMA>;

export const API_VALIDATION_ISSUE_SCHEMA = z.object({
  path: z.string(),
  message: z.string(),
  issueCode: z.string(),
});

export const API_ERROR_SCHEMA = z.object({
  code: API_ERROR_CODE_SCHEMA,
  message: z.string(),
  details: z
    .object({
      validationIssues: z.array(API_VALIDATION_ISSUE_SCHEMA),
    })
    .optional(),
});

export const API_FAILURE_RESPONSE_SCHEMA = z.object({
  ok: z.literal(false),
  error: API_ERROR_SCHEMA,
});

export type ApiFailureResponse = z.infer<typeof API_FAILURE_RESPONSE_SCHEMA>;

export function apiSuccessResponseSchema<DataSchema extends z.ZodTypeAny>(
  dataSchema: DataSchema,
) {
  return z.object({
    ok: z.literal(true),
    data: dataSchema,
  });
}

export type ApiSuccessResponse<Data> = {
  ok: true;
  data: Data;
};

export type ApiRouteResponse<Data> = ApiSuccessResponse<Data> | ApiFailureResponse;
