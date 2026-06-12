import { NextResponse } from "next/server";
import { ShowcaseLifecycleState } from "@prisma/client";
import { z } from "zod";
import { evaluateHostUpdatePolicy } from "@/src/modules/policy/public";
import {
  SHOWCASE_UPDATE_OR_HOST_CONTROL_REQUEST_SCHEMA,
  type ShowcaseUpdateOrHostControlRequest,
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

type HostControlAction = NonNullable<ShowcaseUpdateOrHostControlRequest["hostControl"]>;

function createHostControlRejectionMessage(
  action: HostControlAction["action"],
  reason: string,
): string {
  switch (action) {
    case "cancel-showcase":
      return `Cannot cancel Showcase because ${reason}.`;
    case "extend-submission-close":
      return `Cannot extend submission close because ${reason}.`;
    case "extend-voting-close":
      return `Cannot extend voting close because ${reason}.`;
    default: {
      const exhaustive: never = action;
      throw new Error(`Unsupported host control action: ${exhaustive}`);
    }
  }
}

async function writeHostControlAudit(input: {
  showcaseId: string;
  actorUserId: string;
  fromState: ShowcaseLifecycleState;
  toState: ShowcaseLifecycleState;
  action: HostControlAction["action"];
  outcome: "applied" | "rejected";
  reason?: string;
  metadata?: Record<string, unknown>;
}) {
  await prisma.transitionAuditEvent.create({
    data: {
      showcaseId: input.showcaseId,
      actorUserId: input.actorUserId,
      fromState: input.fromState,
      toState: input.toState,
      reason: input.reason,
      metadata: {
        action: input.action,
        outcome: input.outcome,
        ...(input.metadata ?? {}),
      },
    },
  });
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

  const parsedRequest = await parseJsonBody(request, SHOWCASE_UPDATE_OR_HOST_CONTROL_REQUEST_SCHEMA);
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
      submissionClosesAt: true,
      votingOpensAt: true,
      votingClosesAt: true,
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
    if (!parsedRequest.data.hostControl) {
      return settingsLockedResponse(
        "Showcase settings are locked after submission opens and cannot be modified.",
      );
    }
  }

  const data = parsedRequest.data;

  if (data.hostControl) {
    const action = data.hostControl;
    const actorUserId = authResult.session.user.sub;
    const now = new Date();

    if (action.action === "cancel-showcase") {
      const isAllowed =
        existingShowcase.lifecycleState === ShowcaseLifecycleState.CREATION ||
        existingShowcase.lifecycleState === ShowcaseLifecycleState.SUBMISSION_OPEN;

      if (!isAllowed) {
        await writeHostControlAudit({
          showcaseId: existingShowcase.id,
          actorUserId,
          fromState: existingShowcase.lifecycleState,
          toState: ShowcaseLifecycleState.CANCELED,
          action: "cancel-showcase",
          outcome: "rejected",
          reason: action.reason,
          metadata: {
            rejectionReason: "cancel-allowed-only-before-voting-opens",
          },
        });

        return stateInvalidResponse(
          createHostControlRejectionMessage(
            "cancel-showcase",
            "cancel is only allowed before voting opens",
          ),
        );
      }

      const updatedShowcase = await prisma.$transaction(async (tx) => {
        const showcase = await tx.showcase.update({
          where: { id: existingShowcase.id },
          data: {
            lifecycleState: ShowcaseLifecycleState.CANCELED,
          },
          select: SHOWCASE_DETAIL_SELECT,
        });

        await tx.transitionAuditEvent.create({
          data: {
            showcaseId: existingShowcase.id,
            actorUserId,
            fromState: existingShowcase.lifecycleState,
            toState: ShowcaseLifecycleState.CANCELED,
            reason: action.reason,
            metadata: {
              action: "cancel-showcase",
              outcome: "applied",
            },
          },
        });

        return showcase;
      });

      const responseBody: ShowcaseUpdateResponse = {
        ok: true,
        data: toShowcaseDetailData(updatedShowcase),
      };

      return NextResponse.json(responseBody, { status: 200 });
    }

    if (action.action === "extend-submission-close") {
      const isAllowedState = existingShowcase.lifecycleState === ShowcaseLifecycleState.SUBMISSION_OPEN;
      const hasSchedule =
        existingShowcase.submissionClosesAt !== null && existingShowcase.votingOpensAt !== null;
      const extendsForward =
        existingShowcase.submissionClosesAt !== null &&
        action.submissionClosesAt > existingShowcase.submissionClosesAt;
      const beforeVotingStarts =
        existingShowcase.votingOpensAt !== null && action.submissionClosesAt < existingShowcase.votingOpensAt;
      const votingNotYetOpen = existingShowcase.votingOpensAt !== null && now < existingShowcase.votingOpensAt;

      if (!isAllowedState || !hasSchedule || !extendsForward || !beforeVotingStarts || !votingNotYetOpen) {
        await writeHostControlAudit({
          showcaseId: existingShowcase.id,
          actorUserId,
          fromState: existingShowcase.lifecycleState,
          toState: existingShowcase.lifecycleState,
          action: "extend-submission-close",
          outcome: "rejected",
          reason: action.reason,
          metadata: {
            rejectionReason: "submission-close-extension-not-allowed",
          },
        });

        return stateInvalidResponse(
          createHostControlRejectionMessage(
            "extend-submission-close",
            "submission close extension is allowed only while submissions are open, before voting starts, and must move the deadline later",
          ),
        );
      }

      const updatedShowcase = await prisma.$transaction(async (tx) => {
        const showcase = await tx.showcase.update({
          where: { id: existingShowcase.id },
          data: {
            submissionClosesAt: action.submissionClosesAt,
          },
          select: SHOWCASE_DETAIL_SELECT,
        });

        await tx.transitionAuditEvent.create({
          data: {
            showcaseId: existingShowcase.id,
            actorUserId,
            fromState: existingShowcase.lifecycleState,
            toState: existingShowcase.lifecycleState,
            reason: action.reason,
            metadata: {
              action: "extend-submission-close",
              outcome: "applied",
              previousSubmissionClosesAt: existingShowcase.submissionClosesAt,
              nextSubmissionClosesAt: action.submissionClosesAt,
            },
          },
        });

        return showcase;
      });

      const responseBody: ShowcaseUpdateResponse = {
        ok: true,
        data: toShowcaseDetailData(updatedShowcase),
      };

      return NextResponse.json(responseBody, { status: 200 });
    }

    const isAllowedState = existingShowcase.lifecycleState === ShowcaseLifecycleState.VOTING_OPEN;
    const hasVotingClose = existingShowcase.votingClosesAt !== null;
    const extendsForward =
      existingShowcase.votingClosesAt !== null && action.votingClosesAt > existingShowcase.votingClosesAt;

    if (!isAllowedState || !hasVotingClose || !extendsForward) {
      await writeHostControlAudit({
        showcaseId: existingShowcase.id,
        actorUserId,
        fromState: existingShowcase.lifecycleState,
        toState: existingShowcase.lifecycleState,
        action: "extend-voting-close",
        outcome: "rejected",
        reason: action.reason,
        metadata: {
          rejectionReason: "voting-close-extension-not-allowed",
        },
      });

      return stateInvalidResponse(
        createHostControlRejectionMessage(
          "extend-voting-close",
          "voting close extension is allowed only while voting is open and must move the deadline later",
        ),
      );
    }

    const updatedShowcase = await prisma.$transaction(async (tx) => {
      const showcase = await tx.showcase.update({
        where: { id: existingShowcase.id },
        data: {
          votingClosesAt: action.votingClosesAt,
        },
        select: SHOWCASE_DETAIL_SELECT,
      });

      await tx.transitionAuditEvent.create({
        data: {
          showcaseId: existingShowcase.id,
          actorUserId,
          fromState: existingShowcase.lifecycleState,
          toState: existingShowcase.lifecycleState,
          reason: action.reason,
          metadata: {
            action: "extend-voting-close",
            outcome: "applied",
            previousVotingClosesAt: existingShowcase.votingClosesAt,
            nextVotingClosesAt: action.votingClosesAt,
          },
        },
      });

      return showcase;
    });

    const responseBody: ShowcaseUpdateResponse = {
      ok: true,
      data: toShowcaseDetailData(updatedShowcase),
    };

    return NextResponse.json(responseBody, { status: 200 });
  }

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
