import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiFailureResponse } from "@/src/api/contracts/common";
import type { PolicyDenialReason } from "@/src/api/contracts/policy";

export function policyDeniedMessage(reason: PolicyDenialReason): string {
  switch (reason) {
    case "authentication-required":
      return "You must be authenticated to perform this action.";
    case "verified-email-required":
      return "You must verify your email address before performing this action.";
    case "host-membership-required":
      return "Only the Host of this Showcase may perform this action.";
    case "invite-required":
      return "An accepted invite is required to perform this action.";
    case "participant-cannot-vote":
      return "Participants cannot vote in the same Showcase they entered.";
    default: {
      const _exhaustive: never = reason;
      return "Current requester is not allowed to perform this action.";
    }
  }
}

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

export function policyDeniedResponse(
  message: string,
  policyDenialReason: PolicyDenialReason,
): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "policy-denied",
        message,
        details: {
          policyDenialReason,
        },
      },
    },
    { status: 403 },
  );
}

export function authenticationRequiredResponse(message: string): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "authentication-required",
        message,
      },
    },
    { status: 401 },
  );
}

export function verifiedEmailRequiredResponse(message: string): NextResponse<ApiFailureResponse> {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "verified-email-required",
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
