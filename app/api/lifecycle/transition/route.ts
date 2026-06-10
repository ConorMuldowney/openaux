import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  canTransitionLifecycle,
  fromPrismaLifecycleState,
  toPrismaLifecycleState,
} from "@/src/modules/lifecycle/public";
import {
  LIFECYCLE_TRANSITION_REQUEST_SCHEMA,
  type LifecycleTransitionResponse,
} from "@/src/api/contracts/lifecycle";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, LIFECYCLE_TRANSITION_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedRequest.data.showcaseId },
    select: { id: true, lifecycleState: true },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot transition lifecycle for Showcase '${parsedRequest.data.showcaseId}' because it does not exist.`,
    );
  }

  const currentState = fromPrismaLifecycleState(showcase.lifecycleState);
  if (!currentState) {
    return stateInvalidResponse(
      `Cannot transition lifecycle from unsupported persisted state '${showcase.lifecycleState}'.`,
    );
  }

  const canTransition = canTransitionLifecycle(currentState, parsedRequest.data.nextState);

  if (!canTransition) {
    await prisma.transitionAuditEvent.create({
      data: {
        showcaseId: parsedRequest.data.showcaseId,
        actorUserId: authResult.session.user.sub,
        fromState: toPrismaLifecycleState(currentState),
        toState: toPrismaLifecycleState(parsedRequest.data.nextState),
        reason: parsedRequest.data.reason,
        metadata: {
          outcome: "rejected",
          ...(parsedRequest.data.metadata ?? {}),
        },
      },
    });

    return stateInvalidResponse(
      `Cannot transition showcase lifecycle from '${currentState}' to '${parsedRequest.data.nextState}'.`,
    );
  }

  const transitionAuditEvent = await prisma.$transaction(async (tx) => {
    await tx.showcase.update({
      where: { id: parsedRequest.data.showcaseId },
      data: {
        lifecycleState: toPrismaLifecycleState(parsedRequest.data.nextState),
        finalizedAt:
          parsedRequest.data.nextState === "finalized" ? new Date() : undefined,
      },
    });

    return tx.transitionAuditEvent.create({
      data: {
        showcaseId: parsedRequest.data.showcaseId,
        actorUserId: authResult.session.user.sub,
        fromState: toPrismaLifecycleState(currentState),
        toState: toPrismaLifecycleState(parsedRequest.data.nextState),
        reason: parsedRequest.data.reason,
        metadata: {
          outcome: "applied",
          ...(parsedRequest.data.metadata ?? {}),
        },
      },
      select: { id: true },
    });
  });

  const responseBody: LifecycleTransitionResponse = {
    ok: true,
    data: {
      previousState: currentState,
      nextState: parsedRequest.data.nextState,
      transitionAuditEventId: transitionAuditEvent.id,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
