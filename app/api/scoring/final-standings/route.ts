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
import { observeSignal, observeException } from "@/src/observability/server";
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
    observeSignal({
      name: "scoring.final-standings.denied",
      level: "warn",
      context: {
        route: "/api/scoring/final-standings",
        showcaseId: parsedRequest.data.showcaseId,
        lifecycleState,
      },
    });

    return stateInvalidResponse(
      `Final standings are not available until the Showcase is finalized. Current state: '${lifecycleState}'.`,
    );
  }

  let record: {
    showcaseId: string;
    standings: unknown;
    publishedAt: Date;
  } | null;

  try {
    record = await prisma.finalStandings.findUnique({
      where: { showcaseId: parsedRequest.data.showcaseId },
      select: { showcaseId: true, standings: true, publishedAt: true },
    });
  } catch (error) {
    observeException({
      name: "scoring.final-standings.query-failed",
      error,
      context: {
        route: "/api/scoring/final-standings",
        showcaseId: parsedRequest.data.showcaseId,
      },
    });

    throw error;
  }

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

  observeSignal({
    name: "scoring.final-standings.returned",
    context: {
      route: "/api/scoring/final-standings",
      showcaseId: record.showcaseId,
      standingsCount: parsedStandings.data.length,
      publishedAt: record.publishedAt.toISOString(),
    },
  });

  return NextResponse.json(responseBody, { status: 200 });
}
