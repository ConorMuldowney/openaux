import { NextResponse } from "next/server";
import { shouldRevealParticipantIdentity } from "@/src/modules/visibility/public";
import {
  VISIBILITY_PARTICIPANT_IDENTITY_REQUEST_SCHEMA,
  type VisibilityParticipantIdentityResponse,
} from "@/src/api/contracts/visibility";
import { parseJsonBody } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, VISIBILITY_PARTICIPANT_IDENTITY_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const shouldReveal = shouldRevealParticipantIdentity(parsedRequest.data);

  const responseBody: VisibilityParticipantIdentityResponse = {
    ok: true,
    data: {
      shouldRevealParticipantIdentity: shouldReveal,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
