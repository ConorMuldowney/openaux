import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  canTransitionLifecycle,
  fromPrismaLifecycleState,
  toPrismaLifecycleState,
} from "@/src/modules/lifecycle/public";
import { computeShowcaseStandings } from "@/src/modules/scoring/public";
import {
  LIFECYCLE_TRANSITION_REQUEST_SCHEMA,
  type LifecycleTransitionResponse,
} from "@/src/api/contracts/lifecycle";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { observeSignal, observeException } from "@/src/observability/server";

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
    select: { id: true, lifecycleState: true, maxRankedPicks: true },
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
    observeSignal({
      name: "lifecycle.transition.denied",
      level: "warn",
      context: {
        route: "/api/lifecycle/transition",
        showcaseId: parsedRequest.data.showcaseId,
        actorUserId: authResult.session.user.sub,
        fromState: currentState,
        toState: parsedRequest.data.nextState,
      },
    });

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

  let transitionAuditEvent: { id: string };

  try {
    transitionAuditEvent = await prisma.$transaction(async (tx) => {
      await tx.showcase.update({
        where: { id: parsedRequest.data.showcaseId },
        data: {
          lifecycleState: toPrismaLifecycleState(parsedRequest.data.nextState),
          finalizedAt:
            parsedRequest.data.nextState === "finalized" ? new Date() : undefined,
        },
      });

      if (parsedRequest.data.nextState === "finalized") {
        const ballots = await tx.ballot.findMany({
          where: { showcaseId: parsedRequest.data.showcaseId },
          include: { currentVersion: true },
        });

        const entries = await tx.entry.findMany({
          where: { showcaseId: parsedRequest.data.showcaseId },
          select: { participantId: true, submittedAt: true },
        });

        const storedBallots = ballots
          .filter((ballot) => ballot.currentVersion !== null)
          .map((ballot) => ({
            voterId: ballot.voterUserId,
            rankedParticipantIds: ballot.currentVersion!.rankedParticipantIds as string[],
          }));

        const rawRankedParticipantCount = storedBallots.reduce(
          (sum, ballot) => sum + ballot.rankedParticipantIds.length,
          0,
        );

        const entryTimestamps = entries.map((entry) => ({
          participantId: entry.participantId,
          submittedAt: entry.submittedAt,
        }));

        const standings = computeShowcaseStandings(
          storedBallots,
          showcase.maxRankedPicks,
          entryTimestamps,
        );

        const standingParticipantIds = new Set(standings.map((standing) => standing.participantId));
        const compressedRankedParticipantCount = storedBallots.reduce(
          (sum, ballot) =>
            sum +
            ballot.rankedParticipantIds.filter((participantId) => standingParticipantIds.has(participantId))
              .length,
          0,
        );

        observeSignal({
          name: "scoring.disqualification.recomputed",
          context: {
            route: "/api/lifecycle/transition",
            showcaseId: parsedRequest.data.showcaseId,
            validEntryCount: entries.length,
            excludedRankedPickCount:
              rawRankedParticipantCount - compressedRankedParticipantCount,
          },
        });

        observeSignal({
          name: "scoring.final-standings.computed",
          context: {
            route: "/api/lifecycle/transition",
            showcaseId: parsedRequest.data.showcaseId,
            ballotsCount: storedBallots.length,
            standingsCount: standings.length,
          },
        });

        await tx.finalStandings.create({
          data: {
            showcaseId: parsedRequest.data.showcaseId,
            standings,
          },
        });
      }

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
  } catch (error) {
    observeException({
      name: "lifecycle.transition.failed",
      error,
      context: {
        route: "/api/lifecycle/transition",
        showcaseId: parsedRequest.data.showcaseId,
        actorUserId: authResult.session.user.sub,
        fromState: currentState,
        toState: parsedRequest.data.nextState,
      },
    });

    throw error;
  }

  observeSignal({
    name: "lifecycle.transition.applied",
    context: {
      route: "/api/lifecycle/transition",
      showcaseId: parsedRequest.data.showcaseId,
      actorUserId: authResult.session.user.sub,
      fromState: currentState,
      toState: parsedRequest.data.nextState,
      transitionAuditEventId: transitionAuditEvent.id,
    },
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
