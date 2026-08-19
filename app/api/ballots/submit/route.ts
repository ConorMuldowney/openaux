import { NextResponse } from "next/server";
import { validateRankedBallot } from "@/src/modules/ballots/public";
import { evaluateSubmitBallotPolicy } from "@/src/modules/policy/public";
import {
  BALLOTS_SUBMIT_REQUEST_SCHEMA,
  type BallotsSubmitResponse,
} from "@/src/api/contracts/ballots";
import {
  parseJsonBody,
  policyDeniedMessage,
  policyDeniedResponse,
  stateInvalidResponse,
} from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";
import { prisma } from "@/src/db/prisma";
import { observeSignal, observeException } from "@/src/observability/server";
import { isAtOrAfterUtcInstant, isBeforeUtcInstant } from "@/src/domain/time/public";
import { reconcileScheduledLifecycle } from "@/src/api/lifecycle/schedule";

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, BALLOTS_SUBMIT_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const { showcaseId, rankedBallot } = parsedRequest.data;
  const voterId = authResult.session.user.sub!;

  // Fetch showcase to check state and voting window
  const showcase = await prisma.showcase.findUnique({
    where: { id: showcaseId },
    select: {
      id: true,
      lifecycleState: true,
      voterScope: true,
      votingOpensAt: true,
      votingClosesAt: true,
      submissionOpensAt: true,
      submissionClosesAt: true,
      maxRankedPicks: true,
      participants: {
        where: { userId: voterId },
        select: { id: true },
      },
      invites: {
        where: {
          scope: "VOTER",
          acceptedByUserId: voterId,
          revokedAt: null,
        },
        select: { id: true },
      },
    },
  });

  if (!showcase) {
    return stateInvalidResponse("Showcase not found.");
  }

  const reconciledLifecycleState = await reconcileScheduledLifecycle(prisma, showcase);

  // Check voting state
  if ((reconciledLifecycleState ?? showcase.lifecycleState) !== "VOTING_OPEN") {
    return stateInvalidResponse("Voting is not currently open for this showcase.");
  }

  // Check voting window (UTC, end-exclusive)
  const now = new Date();
  if (showcase.votingOpensAt && isBeforeUtcInstant(now, showcase.votingOpensAt)) {
    return stateInvalidResponse("Voting has not yet opened.");
  }

  if (showcase.votingClosesAt && isAtOrAfterUtcInstant(now, showcase.votingClosesAt)) {
    return stateInvalidResponse("Voting has closed.");
  }

  // Map AccessScope to voterScope domain language
  const voterScope = showcase.voterScope === "PRIVATE" ? "invite-only-authenticated" : "public-authenticated";

  // Evaluate policy
  const policyDecision = evaluateSubmitBallotPolicy({
    voterScope,
    isAuthenticated: true,
    isVerifiedEmail: true,
    isParticipantInShowcase: showcase.participants.length > 0,
    isInvited: voterScope === "invite-only-authenticated" ? showcase.invites.length > 0 : true,
  });

  if (!policyDecision.allowed) {
    return policyDeniedResponse(
      policyDeniedMessage(policyDecision.reason),
      policyDecision.reason,
      {
        route: "/api/ballots/submit",
        showcaseId,
      },
    );
  }

  // Validate ballot
  const validationResult = validateRankedBallot(
    rankedBallot,
    showcase.maxRankedPicks,
  );

  if (!validationResult.isValid) {
    observeSignal({
      name: "ballot.validation.failed",
      level: "warn",
      context: {
        route: "/api/ballots/submit",
        showcaseId,
        voterId,
        reason: validationResult.reason,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "validation-error",
          message: "Request validation failed.",
          details: {
            validationIssues: [
              {
                path: "rankedBallot",
                message: `Ranked ballot is invalid: ${validationResult.reason}.`,
                issueCode: "custom",
              },
            ],
          },
        },
      },
      { status: 400 },
    );
  }

  // Get or create ballot and create new version
  try {
    let ballot = await prisma.ballot.findUnique({
      where: {
        showcaseId_voterUserId: {
          showcaseId,
          voterUserId: voterId,
        },
      },
      select: { id: true, versions: { select: { versionNumber: true } } },
    });

    let versionNumber = 1;
    const createdBallot = !ballot;

    if (ballot) {
      versionNumber =
        Math.max(
          ...ballot.versions.map((v: { versionNumber: number }) => v.versionNumber),
          0,
        ) + 1;
    } else {
      ballot = await prisma.ballot.create({
        data: {
          showcaseId,
          voterUserId: voterId,
        },
        select: { id: true, versions: { select: { versionNumber: true } } },
      });
    }

    const ballotVersion = await prisma.ballotVersion.create({
      data: {
        ballotId: ballot.id,
        versionNumber,
        rankedParticipantIds: rankedBallot.picks.map((pick) => pick.participantId),
      },
    });

    await prisma.ballot.update({
      where: { id: ballot.id },
      data: { currentVersionId: ballotVersion.id },
    });

    observeSignal({
      name: "ballot.write.completed",
      context: {
        route: "/api/ballots/submit",
        showcaseId,
        voterId,
        ballotId: ballot.id,
        versionNumber,
        createdBallot,
        picksCount: rankedBallot.picks.length,
      },
    });

    const responseBody: BallotsSubmitResponse = {
      ok: true,
      data: {
        ballotId: ballot.id,
        versionNumber,
      },
    };

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    observeException({
      name: "ballot.write.failed",
      error,
      context: {
        route: "/api/ballots/submit",
        showcaseId,
        voterId,
      },
    });

    throw error;
  }
}
