import { NextResponse } from "next/server";
import { scoreRankedBallot } from "@/src/modules/scoring/public";
import {
  SCORING_RANKED_BALLOT_REQUEST_SCHEMA,
  type ScoringRankedBallotResponse,
} from "@/src/api/contracts/scoring";
import { parseJsonBody } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { observeSignal } from "@/src/observability/server";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, SCORING_RANKED_BALLOT_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const scores = scoreRankedBallot(
    parsedRequest.data.rankedBallot,
    parsedRequest.data.maxRankedPicks,
  );

  observeSignal({
    name: "scoring.ranked-ballot.computed",
    context: {
      route: "/api/scoring/ranked-ballot",
      voterId: authResult.session.user.sub,
      picksCount: parsedRequest.data.rankedBallot.picks.length,
      maxRankedPicks: parsedRequest.data.maxRankedPicks,
      scoresCount: scores.length,
    },
  });

  const responseBody: ScoringRankedBallotResponse = {
    ok: true,
    data: {
      scores,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
