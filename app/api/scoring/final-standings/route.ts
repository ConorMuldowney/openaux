import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { fromPrismaLifecycleState } from "@/src/modules/lifecycle/public";
import { shouldRevealVotingResults } from "@/src/modules/visibility/public";
import {
  SCORING_FINAL_STANDINGS_REQUEST_SCHEMA,
  FINAL_STANDING_SCHEMA,
  type ScoringFinalStandingsResponse,
} from "@/src/api/contracts/scoring";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { z } from "zod";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, SCORING_FINAL_STANDINGS_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedRequest.data.showcaseId },
    select: { id: true, lifecycleState: true },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot retrieve final standings for Showcase '${parsedRequest.data.showcaseId}' because it does not exist.`,
    );
  }

  const lifecycleState = fromPrismaLifecycleState(showcase.lifecycleState);
  if (!lifecycleState) {
    return stateInvalidResponse(
      `Cannot retrieve final standings from unsupported persisted state '${showcase.lifecycleState}'.`,
    );
  }

  if (!shouldRevealVotingResults({ lifecycleState })) {
    return stateInvalidResponse(
      `Final standings are not available until the Showcase is finalized. Current state: '${lifecycleState}'.`,
    );
  }

  const record = await prisma.finalStandings.findUnique({
    where: { showcaseId: parsedRequest.data.showcaseId },
    select: { showcaseId: true, standings: true, publishedAt: true },
  });

  if (!record) {
    return stateInvalidResponse(
      `Final standings have not been published for Showcase '${parsedRequest.data.showcaseId}'.`,
    );
  }

  const parsedStandings = z.array(FINAL_STANDING_SCHEMA).safeParse(record.standings);
  if (!parsedStandings.success) {
    return stateInvalidResponse(
      `Final standings data for Showcase '${parsedRequest.data.showcaseId}' is malformed.`,
    );
  }

  const responseBody: ScoringFinalStandingsResponse = {
    ok: true,
    data: {
      showcaseId: record.showcaseId,
      publishedAt: record.publishedAt.toISOString(),
      standings: parsedStandings.data,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
