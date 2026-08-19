import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  ShowcaseConfirmEntryResponse,
  ShowcaseReadEntriesResponse,
} from "@/src/api/contracts/showcases";
import { SHOWCASE_CONFIRM_ENTRY_REQUEST_SCHEMA } from "@/src/api/contracts/showcases";
import { auth0 } from "@/src/auth/auth0";
import { requireAuthenticatedSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import { evaluateShowcaseReadPolicy } from "@/src/api/showcase-read-access";
import {
  parseJsonBody,
  policyDeniedMessage,
  policyDeniedResponse,
  stateInvalidResponse,
} from "@/src/api/route-handler";
import { shouldRevealParticipantIdentity } from "@/src/modules/visibility/public";
import { fromPrismaLifecycleState } from "@/src/modules/lifecycle/public";
import { evaluateSubmitEntryPolicy } from "@/src/modules/policy/public";
import { isEntryValidForRequiredSamples } from "@/src/modules/submissions/public";
import { isEntryStorageKeyOwnedByParticipant } from "@/src/storage/public";

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

export async function GET(
  request: Request,
  context: { params: Promise<{ showcaseId: string }> },
) {
  const parsedParams = parseShowcaseId(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }

  const session = await auth0.getSession(request as NextRequest);
  const userId = session?.user.sub;

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedParams.showcaseId },
    select: {
      id: true,
      hostUserId: true,
      listenerScope: true,
      lifecycleState: true,
      blindJudgingEnabled: true,
    },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot read Entry list for Showcase '${parsedParams.showcaseId}' because it does not exist.`,
    );
  }

  const policyDecision = await evaluateShowcaseReadPolicy({
    prisma,
    showcaseId: showcase.id,
    hostUserId: showcase.hostUserId,
    listenerScope: showcase.listenerScope,
    userId,
  });

  if (!policyDecision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(policyDecision.reason), policyDecision.reason);
  }

  const lifecycleState = fromPrismaLifecycleState(showcase.lifecycleState);
  if (!lifecycleState) {
    return stateInvalidResponse(
      `Cannot read entries from unsupported persisted state '${showcase.lifecycleState}'.`,
    );
  }

  const revealIdentity = shouldRevealParticipantIdentity({
    isBlindJudgingEnabled: showcase.blindJudgingEnabled,
    lifecycleState,
  });

  const entries = await prisma.entry.findMany({
    where: { showcaseId: showcase.id },
    select: {
      id: true,
      storageKey: true,
      submittedAt: true,
      updatedAt: true,
      isValid: true,
      participant: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      {
        submittedAt: "asc",
      },
      {
        id: "asc",
      },
    ],
  });

  const responseBody: ShowcaseReadEntriesResponse = {
    ok: true,
    data: {
      showcaseId: showcase.id,
      lifecycleState,
      blindJudgingEnabled: showcase.blindJudgingEnabled,
      entries: entries.map((entry, index) => ({
        entryId: entry.id,
        participantId: revealIdentity ? entry.participant.id : null,
        participantAlias: revealIdentity ? null : `Participant ${index + 1}`,
        storageKey: entry.storageKey,
        submittedAt: entry.submittedAt,
        updatedAt: entry.updatedAt,
        isValidForRequiredSamples: entry.isValid,
      })),
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

const REQUIRED_SAMPLE_IDS_SCHEMA = z.array(z.string());

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

  const parsedBody = await parseJsonBody(request, SHOWCASE_CONFIRM_ENTRY_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const userId = authResult.session.user.sub;
  const showcaseId = parsedParams.showcaseId;

  const showcase = await prisma.showcase.findUnique({
    where: { id: showcaseId },
    select: { id: true, participationScope: true, lifecycleState: true, requiredSampleIds: true },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot confirm an Entry for Showcase '${showcaseId}' because it does not exist.`,
    );
  }

  const lifecycleState = fromPrismaLifecycleState(showcase.lifecycleState);
  if (lifecycleState !== "submission-open") {
    return stateInvalidResponse(
      `Cannot confirm an Entry because Showcase '${showcaseId}' is not open for submissions.`,
    );
  }

  const participant = await prisma.participant.findUnique({
    where: { showcaseId_userId: { showcaseId, userId } },
    select: { id: true },
  });

  const policyDecision = evaluateSubmitEntryPolicy({
    participationScope: showcase.participationScope === "PUBLIC" ? "public" : "invite-only",
    isAuthenticated: true,
    isInvited: participant !== null,
  });

  if (!policyDecision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(policyDecision.reason), policyDecision.reason);
  }

  if (!participant) {
    return stateInvalidResponse(
      `Cannot confirm an Entry because no Participant record exists for this user in Showcase '${showcaseId}'.`,
    );
  }

  const { storageKey, usedSampleIds } = parsedBody.data;

  if (!isEntryStorageKeyOwnedByParticipant({ storageKey, showcaseId, participantId: participant.id })) {
    return stateInvalidResponse(
      "Cannot confirm an Entry because the provided storageKey was not issued to this Participant.",
    );
  }

  const requiredSampleIds = REQUIRED_SAMPLE_IDS_SCHEMA.parse(showcase.requiredSampleIds);
  const isValid = isEntryValidForRequiredSamples({
    participantId: participant.id,
    showcaseId,
    requiredSampleIds,
    usedSampleIds,
  });

  const entry = await prisma.entry.upsert({
    where: { participantId_showcaseId: { participantId: participant.id, showcaseId } },
    create: {
      showcaseId,
      participantId: participant.id,
      storageKey,
      isValid,
      validationDetails: { usedSampleIds },
    },
    update: {
      storageKey,
      isValid,
      validationDetails: { usedSampleIds },
    },
    select: {
      id: true,
      storageKey: true,
      submittedAt: true,
      updatedAt: true,
      isValid: true,
    },
  });

  const responseBody: ShowcaseConfirmEntryResponse = {
    ok: true,
    data: {
      entryId: entry.id,
      storageKey: entry.storageKey,
      submittedAt: entry.submittedAt,
      updatedAt: entry.updatedAt,
      isValidForRequiredSamples: entry.isValid,
    },
  };

  return NextResponse.json(responseBody, { status: 201 });
}

