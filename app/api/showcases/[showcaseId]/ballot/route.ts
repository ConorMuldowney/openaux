import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ShowcaseBallotResponse } from "@/src/api/contracts/showcases";
import { SHOWCASE_BALLOT_REQUEST_SCHEMA } from "@/src/api/contracts/showcases";
import { requireAuthenticatedSession } from "@/src/api/auth";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { prisma } from "@/src/db/prisma";
import { POST as submitBallot } from "@/app/api/ballots/submit/route";

const SHOWCASE_ID_PARAMS_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
});

function parseShowcaseId(
  params: { showcaseId?: string },
): { ok: true; showcaseId: string } | { ok: false; response: NextResponse } {
  const parsedParams = SHOWCASE_ID_PARAMS_SCHEMA.safeParse(params);
  if (!parsedParams.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: {
            code: "validation-error",
            message: "Path parameter 'showcaseId' must be a valid UUID.",
            details: {
              validationIssues: parsedParams.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
                issueCode: issue.code,
              })),
            },
          },
        },
        { status: 400 },
      ),
    };
  }

  return {
    ok: true,
    showcaseId: parsedParams.data.showcaseId,
  };
}

// GET returns the current voter's ranked ballot expressed as ordered Entry ids, so the
// Showcase UI can restore a voter's preferred ordering without ever handling participantIds.
export async function GET(
  request: Request,
  context: { params: Promise<{ showcaseId: string }> },
) {
  const parsedParams = parseShowcaseId(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }

  const authResult = await requireAuthenticatedSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const showcaseId = parsedParams.showcaseId;
  const voterId = authResult.session.user.sub;

  const ballot = await prisma.ballot.findUnique({
    where: { showcaseId_voterUserId: { showcaseId, voterUserId: voterId } },
    select: { currentVersion: { select: { rankedParticipantIds: true } } },
  });

  const rankedParticipantIds = (ballot?.currentVersion?.rankedParticipantIds as string[] | undefined) ?? [];

  let rankedEntryIds: string[] = [];
  if (rankedParticipantIds.length > 0) {
    const entries = await prisma.entry.findMany({
      where: { showcaseId, participantId: { in: rankedParticipantIds } },
      select: { id: true, participantId: true },
    });

    const participantIdToEntryId = new Map(entries.map((entry) => [entry.participantId, entry.id]));
    rankedEntryIds = rankedParticipantIds
      .map((participantId) => participantIdToEntryId.get(participantId))
      .filter((entryId): entryId is string => Boolean(entryId));
  }

  const responseBody: ShowcaseBallotResponse = {
    ok: true,
    data: { rankedEntryIds },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

// POST accepts a ranked list of Entry ids, resolves them to participantIds server-side
// (Entry identity is never exposed to the client during Blind Judging), and delegates the
// actual write to the ballots submit route so validation and versioning stay in one place.
export async function POST(
  request: Request,
  context: { params: Promise<{ showcaseId: string }> },
) {
  const parsedParams = parseShowcaseId(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }

  const authResult = await requireAuthenticatedSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request, SHOWCASE_BALLOT_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const showcaseId = parsedParams.showcaseId;
  const voterId = authResult.session.user.sub;
  const { rankedEntryIds } = parsedBody.data;

  const entries = await prisma.entry.findMany({
    where: { showcaseId, id: { in: rankedEntryIds } },
    select: { id: true, participantId: true },
  });

  const entryIdToParticipantId = new Map(entries.map((entry) => [entry.id, entry.participantId]));
  const participantIds = rankedEntryIds.map((entryId) => entryIdToParticipantId.get(entryId));

  if (participantIds.some((participantId) => !participantId)) {
    return stateInvalidResponse(
      `Cannot submit a ranked ballot because one or more ranked entries do not belong to Showcase '${showcaseId}'.`,
    );
  }

  const proxyRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({
      showcaseId,
      rankedBallot: {
        voterId,
        picks: (participantIds as string[]).map((participantId, index) => ({
          rank: index + 1,
          participantId,
        })),
      },
    }),
  });

  const submitResponse = await submitBallot(proxyRequest as NextRequest);
  const submitBody = (await submitResponse.json()) as
    | { ok: true; data: { ballotId: string; versionNumber: number } }
    | { ok: false; error: unknown };

  if (!submitBody.ok) {
    return NextResponse.json(submitBody, { status: submitResponse.status });
  }

  const responseBody: ShowcaseBallotResponse = {
    ok: true,
    data: { rankedEntryIds },
  };

  return NextResponse.json(responseBody, { status: submitResponse.status });
}
