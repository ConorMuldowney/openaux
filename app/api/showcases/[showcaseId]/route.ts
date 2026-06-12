import { NextResponse } from "next/server";
import { z } from "zod";
import { evaluateHostUpdatePolicy } from "@/src/modules/policy/public";
import {
  SHOWCASE_UPDATE_REQUEST_SCHEMA,
  type ShowcaseDetailResponse,
  type ShowcaseUpdateResponse,
} from "@/src/api/contracts/showcases";
import {
  parseJsonBody,
  policyDeniedMessage,
  policyDeniedResponse,
  settingsLockedResponse,
  stateInvalidResponse,
} from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import {
  isShowcaseSettingsLocked,
  SHOWCASE_DETAIL_SELECT,
  toPrismaAccessScope,
  toPrismaVoterScope,
  toShowcaseDetailData,
} from "@/src/api/showcases";

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
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedParams = parseShowcaseId(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedParams.showcaseId },
    select: SHOWCASE_DETAIL_SELECT,
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot read Showcase '${parsedParams.showcaseId}' because it does not exist.`,
    );
  }

  const policyDecision = evaluateHostUpdatePolicy({
    isAuthenticated: true,
    isVerifiedEmail: true,
    isHostOfShowcase: showcase.hostUserId === authResult.session.user.sub,
  });

  if (!policyDecision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(policyDecision.reason), policyDecision.reason);
  }

  const responseBody: ShowcaseDetailResponse = {
    ok: true,
    data: toShowcaseDetailData(showcase),
  };

  return NextResponse.json(responseBody, { status: 200 });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ showcaseId: string }> },
) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedParams = parseShowcaseId(await context.params);
  if (!parsedParams.ok) {
    return parsedParams.response;
  }

  const parsedRequest = await parseJsonBody(request, SHOWCASE_UPDATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const existingShowcase = await prisma.showcase.findUnique({
    where: { id: parsedParams.showcaseId },
    select: {
      id: true,
      hostUserId: true,
      lifecycleState: true,
      submissionOpensAt: true,
    },
  });

  if (!existingShowcase) {
    return stateInvalidResponse(
      `Cannot update Showcase '${parsedParams.showcaseId}' because it does not exist.`,
    );
  }

  const policyDecision = evaluateHostUpdatePolicy({
    isAuthenticated: true,
    isVerifiedEmail: true,
    isHostOfShowcase: existingShowcase.hostUserId === authResult.session.user.sub,
  });

  if (!policyDecision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(policyDecision.reason), policyDecision.reason);
  }

  if (isShowcaseSettingsLocked(existingShowcase)) {
    return settingsLockedResponse(
      "Showcase settings are locked after submission opens and cannot be modified.",
    );
  }

  const data = parsedRequest.data;
  const updatedShowcase = await prisma.showcase.update({
    where: { id: existingShowcase.id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.participationScope !== undefined
        ? { participationScope: toPrismaAccessScope(data.participationScope) }
        : {}),
      ...(data.listenerScope !== undefined
        ? { listenerScope: toPrismaAccessScope(data.listenerScope) }
        : {}),
      ...(data.voterScope !== undefined ? { voterScope: toPrismaVoterScope(data.voterScope) } : {}),
      ...(data.blindJudgingEnabled !== undefined
        ? { blindJudgingEnabled: data.blindJudgingEnabled }
        : {}),
      ...(data.maxRankedPicks !== undefined ? { maxRankedPicks: data.maxRankedPicks } : {}),
      ...(data.requiredSampleIds !== undefined ? { requiredSampleIds: data.requiredSampleIds } : {}),
    },
    select: SHOWCASE_DETAIL_SELECT,
  });

  const responseBody: ShowcaseUpdateResponse = {
    ok: true,
    data: toShowcaseDetailData(updatedShowcase),
  };

  return NextResponse.json(responseBody, { status: 200 });
}
