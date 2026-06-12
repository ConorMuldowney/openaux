import { NextResponse } from "next/server";
import { shouldRevealVotingResults } from "@/src/modules/visibility/public";
import {
  VISIBILITY_VOTING_RESULTS_REQUEST_SCHEMA,
  type VisibilityVotingResultsResponse,
} from "@/src/api/contracts/visibility";
import { parseJsonBody } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, VISIBILITY_VOTING_RESULTS_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const shouldReveal = shouldRevealVotingResults(parsedRequest.data);

  const responseBody: VisibilityVotingResultsResponse = {
    ok: true,
    data: {
      shouldRevealVotingResults: shouldReveal,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
