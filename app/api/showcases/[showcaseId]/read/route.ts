import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ShowcaseDetailResponse } from "@/src/api/contracts/showcases";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { SHOWCASE_DETAIL_SELECT, toShowcaseDetailData } from "@/src/api/showcases";
import { evaluateShowcaseReadPolicy } from "@/src/api/showcase-read-access";
import {
  policyDeniedMessage,
  policyDeniedResponse,
  stateInvalidResponse,
} from "@/src/api/route-handler";

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
    select: SHOWCASE_DETAIL_SELECT,
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot read Showcase '${parsedParams.showcaseId}' because it does not exist.`,
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

  const responseBody: ShowcaseDetailResponse = {
    ok: true,
    data: toShowcaseDetailData(showcase),
  };

  return NextResponse.json(responseBody, { status: 200 });
}
