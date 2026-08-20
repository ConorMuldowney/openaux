import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  EntryCommentCreateResponse,
  EntryCommentsListResponse,
} from "@/src/api/contracts/entry-comments";
import { ENTRY_COMMENT_CREATE_REQUEST_SCHEMA } from "@/src/api/contracts/entry-comments";
import { auth0 } from "@/src/auth/auth0";
import { requireAuthenticatedSession } from "@/src/api/auth";
import { evaluateShowcaseReadPolicy } from "@/src/api/showcase-read-access";
import {
  parseJsonBody,
  policyDeniedMessage,
  policyDeniedResponse,
  stateInvalidResponse,
} from "@/src/api/route-handler";
import { prisma } from "@/src/db/prisma";
import { reconcileScheduledLifecycle } from "@/src/api/lifecycle/schedule";
import { fromPrismaLifecycleState } from "@/src/modules/lifecycle/public";
import { shouldRevealParticipantIdentity } from "@/src/modules/visibility/public";
import { assignAnonymousCommentAuthorAliases } from "@/src/modules/comments/public";

const PARAMS_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
  entryId: z.string().uuid(),
});

function parseParams(
  params: { showcaseId?: string; entryId?: string },
): { ok: true; showcaseId: string; entryId: string } | { ok: false; response: NextResponse } {
  const parsedParams = PARAMS_SCHEMA.safeParse(params);
  if (!parsedParams.success) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          error: {
            code: "validation-error",
            message: "Path parameters 'showcaseId' and 'entryId' must be valid UUIDs.",
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

  return { ok: true, showcaseId: parsedParams.data.showcaseId, entryId: parsedParams.data.entryId };
}

async function loadShowcaseAndEntry(showcaseId: string, entryId: string) {
  const showcase = await prisma.showcase.findUnique({
    where: { id: showcaseId },
    select: {
      id: true,
      hostUserId: true,
      listenerScope: true,
      lifecycleState: true,
      submissionOpensAt: true,
      votingOpensAt: true,
      blindJudgingEnabled: true,
    },
  });

  if (!showcase) {
    return { showcase: null, entry: null };
  }

  const entry = await prisma.entry.findUnique({
    where: { id_showcaseId: { id: entryId, showcaseId } },
    select: { id: true },
  });

  return { showcase, entry };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ showcaseId: string; entryId: string }> },
) {
  const parsedParams = parseParams(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }
  const { showcaseId, entryId } = parsedParams;

  const session = await auth0.getSession(request as NextRequest);
  const userId = session?.user.sub;

  const { showcase, entry } = await loadShowcaseAndEntry(showcaseId, entryId);
  if (!showcase || !entry) {
    return stateInvalidResponse(
      `Cannot read comments because Entry '${entryId}' does not exist in Showcase '${showcaseId}'.`,
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

  const reconciledLifecycleState = await reconcileScheduledLifecycle(prisma, showcase);
  const lifecycleState = fromPrismaLifecycleState(reconciledLifecycleState ?? showcase.lifecycleState);
  const revealIdentity = shouldRevealParticipantIdentity({
    isBlindJudgingEnabled: showcase.blindJudgingEnabled,
    lifecycleState: lifecycleState ?? "creation",
  });

  const commentsByCreatedAt = await prisma.entryComment.findMany({
    where: { entryId, showcaseId },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, authorUserId: true, timestampSeconds: true, body: true, createdAt: true },
  });

  const aliasesByAuthorUserId = assignAnonymousCommentAuthorAliases(
    commentsByCreatedAt.map((comment) => comment.authorUserId),
  );

  const comments = [...commentsByCreatedAt]
    .sort((a, b) => a.timestampSeconds - b.timestampSeconds)
    .map((comment) => ({
      id: comment.id,
      timestampSeconds: comment.timestampSeconds,
      body: comment.body,
      authorUserId: revealIdentity ? comment.authorUserId : null,
      authorAlias: revealIdentity ? null : (aliasesByAuthorUserId.get(comment.authorUserId) ?? null),
      createdAt: comment.createdAt,
      isOwnComment: comment.authorUserId === userId,
    }));

  const responseBody: EntryCommentsListResponse = {
    ok: true,
    data: { entryId, comments },
  };

  return NextResponse.json(responseBody, { status: 200 });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ showcaseId: string; entryId: string }> },
) {
  const parsedParams = parseParams(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }
  const { showcaseId, entryId } = parsedParams;

  const authResult = await requireAuthenticatedSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }
  const userId = authResult.session.user.sub;

  const parsedBody = await parseJsonBody(request, ENTRY_COMMENT_CREATE_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const { showcase, entry } = await loadShowcaseAndEntry(showcaseId, entryId);
  if (!showcase || !entry) {
    return stateInvalidResponse(
      `Cannot create a comment because Entry '${entryId}' does not exist in Showcase '${showcaseId}'.`,
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

  const reconciledLifecycleState = await reconcileScheduledLifecycle(prisma, showcase);
  const lifecycleState = fromPrismaLifecycleState(reconciledLifecycleState ?? showcase.lifecycleState);
  const revealIdentity = shouldRevealParticipantIdentity({
    isBlindJudgingEnabled: showcase.blindJudgingEnabled,
    lifecycleState: lifecycleState ?? "creation",
  });

  const comment = await prisma.entryComment.create({
    data: {
      entryId,
      showcaseId,
      authorUserId: userId,
      timestampSeconds: parsedBody.data.timestampSeconds,
      body: parsedBody.data.body,
    },
    select: { id: true, authorUserId: true, timestampSeconds: true, body: true, createdAt: true },
  });

  const responseBody: EntryCommentCreateResponse = {
    ok: true,
    data: {
      id: comment.id,
      timestampSeconds: comment.timestampSeconds,
      body: comment.body,
      authorUserId: revealIdentity ? comment.authorUserId : null,
      authorAlias: revealIdentity ? null : "You",
      createdAt: comment.createdAt,
      isOwnComment: true,
    },
  };

  return NextResponse.json(responseBody, { status: 201 });
}
