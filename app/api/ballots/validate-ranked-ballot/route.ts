import { NextResponse } from "next/server";
import { validateRankedBallot } from "@/src/modules/ballots/public";
import {
  BALLOTS_VALIDATE_REQUEST_SCHEMA,
  type BallotsValidateResponse,
} from "@/src/api/contracts/ballots";
import { parseJsonBody } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, BALLOTS_VALIDATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const validationResult = validateRankedBallot(
    parsedRequest.data.rankedBallot,
    parsedRequest.data.maxRankedPicks,
  );

  const responseBody: BallotsValidateResponse = {
    ok: true,
    data: validationResult,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
