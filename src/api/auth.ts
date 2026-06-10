import type { NextRequest, NextResponse } from "next/server";
import type { ApiFailureResponse } from "@/src/api/contracts/common";
import {
  authenticationRequiredResponse,
  verifiedEmailRequiredResponse,
} from "@/src/api/route-handler";
import { auth0 } from "@/src/auth/auth0";

type AuthSession = Awaited<ReturnType<typeof auth0.getSession>>;

export type VerifiedEmailAuthResult =
  | { ok: true; session: NonNullable<AuthSession> }
  | { ok: false; response: NextResponse<ApiFailureResponse> };

export async function requireVerifiedEmailSession(request: Request): Promise<VerifiedEmailAuthResult> {
  const session = await auth0.getSession(request as NextRequest);

  if (!session) {
    return {
      ok: false,
      response: authenticationRequiredResponse(
        "You must be authenticated to perform this action.",
      ),
    };
  }

  if (session.user.email_verified !== true) {
    return {
      ok: false,
      response: verifiedEmailRequiredResponse(
        "You must verify your email address before performing this action.",
      ),
    };
  }

  return {
    ok: true,
    session,
  };
}