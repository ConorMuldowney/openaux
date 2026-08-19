import { NextResponse } from "next/server";
import { z } from "zod";
import type { ShowcaseEntryUploadUrlResponse } from "@/src/api/contracts/showcases";
import { SHOWCASE_ENTRY_UPLOAD_URL_REQUEST_SCHEMA } from "@/src/api/contracts/showcases";
import { requireAuthenticatedSession } from "@/src/api/auth";
import { parseJsonBody, policyDeniedMessage, policyDeniedResponse, stateInvalidResponse } from "@/src/api/route-handler";
import { prisma } from "@/src/db/prisma";
import { fromPrismaLifecycleState } from "@/src/modules/lifecycle/public";
import { reconcileScheduledLifecycle } from "@/src/api/lifecycle/schedule";
import { evaluateSubmitEntryPolicy } from "@/src/modules/policy/public";
import { createEntryUploadUrl } from "@/src/storage/public";

const SHOWCASE_ID_PARAMS_SCHEMA = z.object({
  showcaseId: z.string().uuid(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ showcaseId: string }> },
) {
  const parsedParams = SHOWCASE_ID_PARAMS_SCHEMA.safeParse(await context.params);
  if (!parsedParams.success) {
    return NextResponse.json(
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
    );
  }

  const authResult = await requireAuthenticatedSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedBody = await parseJsonBody(request, SHOWCASE_ENTRY_UPLOAD_URL_REQUEST_SCHEMA);
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const userId = authResult.session.user.sub;
  const showcaseId = parsedParams.data.showcaseId;

  const showcase = await prisma.showcase.findUnique({
    where: { id: showcaseId },
    select: {
      id: true,
      participationScope: true,
      lifecycleState: true,
      submissionOpensAt: true,
      votingOpensAt: true,
    },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot request an upload URL for Showcase '${showcaseId}' because it does not exist.`,
    );
  }

  const reconciledLifecycleState = await reconcileScheduledLifecycle(prisma, showcase);

  const lifecycleState = fromPrismaLifecycleState(reconciledLifecycleState ?? showcase.lifecycleState);
  if (lifecycleState !== "submission-open") {
    return stateInvalidResponse(
      `Cannot request an upload URL because Showcase '${showcaseId}' is not open for submissions.`,
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
      `Cannot request an upload URL because no Participant record exists for this user in Showcase '${showcaseId}'.`,
    );
  }

  const upload = await createEntryUploadUrl({
    showcaseId,
    participantId: participant.id,
    contentType: parsedBody.data.contentType,
  });

  const responseBody: ShowcaseEntryUploadUrlResponse = {
    ok: true,
    data: upload,
  };

  return NextResponse.json(responseBody, { status: 200 });
}
