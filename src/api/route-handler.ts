import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiFailureResponse } from "@/src/api/contracts/common";

function createValidationErrorResponse(error: z.ZodError): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "validation-error",
        message: "Request validation failed.",
        details: {
          validationIssues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
            issueCode: issue.code,
          })),
        },
      },
    },
    { status: 400 },
  );
}

export async function parseJsonBody<InputSchema extends z.ZodTypeAny>(
  request: Request,
  inputSchema: InputSchema,
): Promise<
  | { ok: true; data: z.infer<InputSchema> }
  | { ok: false; response: NextResponse<ApiFailureResponse> }
> {
  let parsedBody: unknown;

  try {
    parsedBody = await request.json();
  } catch {
    const syntheticError = new z.ZodError([
      {
        code: "custom",
        message: "Body must be valid JSON.",
        path: ["body"],
      },
    ]);
    return {
      ok: false,
      response: createValidationErrorResponse(syntheticError),
    };
  }

  const validatedBody = inputSchema.safeParse(parsedBody);
  if (!validatedBody.success) {
    return {
      ok: false,
      response: createValidationErrorResponse(validatedBody.error),
    };
  }

  return {
    ok: true,
    data: validatedBody.data,
  };
}

export function policyDeniedResponse(message: string): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "policy-denied",
        message,
      },
    },
    { status: 403 },
  );
}

export function stateInvalidResponse(message: string): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "state-invalid",
        message,
      },
    },
    { status: 409 },
  );
}
