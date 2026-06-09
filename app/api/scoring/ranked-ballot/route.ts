import { NextResponse } from "next/server";
import { scoreRankedBallot } from "@/src/modules/scoring/public";
import {
  SCORING_RANKED_BALLOT_REQUEST_SCHEMA,
  type ScoringRankedBallotResponse,
} from "@/src/api/contracts/scoring";
import { parseJsonBody } from "@/src/api/route-handler";

export async function POST(request: Request) {
  const parsedRequest = await parseJsonBody(request, SCORING_RANKED_BALLOT_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const scores = scoreRankedBallot(
    parsedRequest.data.rankedBallot,
    parsedRequest.data.maxRankedPicks,
  );

  const responseBody: ScoringRankedBallotResponse = {
    ok: true,
    data: {
      scores,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
