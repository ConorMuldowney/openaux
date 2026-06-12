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
      lifecycleState: true,
      voterScope: true,
      votingOpensAt: true,
      votingClosesAt: true,
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

  // Check voting state
  if (showcase.lifecycleState !== "VOTING_OPEN") {
    return stateInvalidResponse("Voting is not currently open for this showcase.");
  }

  // Check voting window (UTC, end-exclusive)
  const now = new Date();
  if (showcase.votingOpensAt && now < showcase.votingOpensAt) {
    return stateInvalidResponse("Voting has not yet opened.");
  }

  if (showcase.votingClosesAt && now >= showcase.votingClosesAt) {
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
    );
  }

  // Validate ballot
  const validationResult = validateRankedBallot(
    rankedBallot,
    showcase.maxRankedPicks,
  );

  if (!validationResult.isValid) {
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

  if (ballot) {
    // Ballot exists, get next version number
    versionNumber = Math.max(...ballot.versions.map((v: { versionNumber: number }) => v.versionNumber), 0) + 1;
  } else {
    // Create new ballot
    ballot = await prisma.ballot.create({
      data: {
        showcaseId,
        voterUserId: voterId,
      },
      select: { id: true, versions: { select: { versionNumber: true } } },
    });
  }

  // Create new ballot version
  const ballotVersion = await prisma.ballotVersion.create({
    data: {
      ballotId: ballot.id,
      versionNumber,
      rankedParticipantIds: rankedBallot.picks.map((pick) => pick.participantId),
    },
  });

  // Update ballot to point to new version
  await prisma.ballot.update({
    where: { id: ballot.id },
    data: { currentVersionId: ballotVersion.id },
  });

  const responseBody: BallotsSubmitResponse = {
    ok: true,
    data: {
      ballotId: ballot.id,
      versionNumber,
    },
  };

  return NextResponse.json(responseBody, { status: 201 });
}
