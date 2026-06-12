import { NextResponse } from "next/server";
import { evaluateHostCreatePolicy } from "@/src/modules/policy/public";
import {
  SHOWCASE_CREATE_REQUEST_SCHEMA,
  type ShowcaseCreateResponse,
} from "@/src/api/contracts/showcases";
import {
  parseJsonBody,
  policyDeniedMessage,
  policyDeniedResponse,
} from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import {
  generateUniqueShowcaseSlug,
  SHOWCASE_DETAIL_SELECT,
  toPrismaAccessScope,
  toPrismaVoterScope,
  toShowcaseDetailData,
} from "@/src/api/showcases";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, SHOWCASE_CREATE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const decision = evaluateHostCreatePolicy({
    isAuthenticated: true,
    isVerifiedEmail: true,
  });

  if (!decision.allowed) {
    return policyDeniedResponse(policyDeniedMessage(decision.reason), decision.reason);
  }

  const slug = await generateUniqueShowcaseSlug(prisma, parsedRequest.data.title);
  const showcase = await prisma.showcase.create({
    data: {
      slug,
      title: parsedRequest.data.title,
      hostUserId: authResult.session.user.sub,
      participationScope: toPrismaAccessScope(parsedRequest.data.participationScope),
      listenerScope: toPrismaAccessScope(parsedRequest.data.listenerScope),
      voterScope: toPrismaVoterScope(parsedRequest.data.voterScope),
      blindJudgingEnabled: parsedRequest.data.blindJudgingEnabled,
      maxRankedPicks: parsedRequest.data.maxRankedPicks,
      requiredSampleIds: parsedRequest.data.requiredSampleIds,
      submissionOpensAt: parsedRequest.data.submissionOpensAt,
      submissionClosesAt: parsedRequest.data.submissionClosesAt,
      votingOpensAt: parsedRequest.data.votingOpensAt,
      votingClosesAt: parsedRequest.data.votingClosesAt,
    },
    select: SHOWCASE_DETAIL_SELECT,
  });

  const responseBody: ShowcaseCreateResponse = {
    ok: true,
    data: toShowcaseDetailData(showcase),
  };

  return NextResponse.json(responseBody, { status: 201 });
}
