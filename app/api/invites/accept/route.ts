import { createHash } from "crypto";
import { InviteAcceptanceOutcome, InviteScope, ShowcaseLifecycleState } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  INVITE_ACCEPT_REQUEST_SCHEMA,
  type InviteAcceptResponse,
  type InviteScope as InviteScopeContract,
} from "@/src/api/contracts/invites";
import { parseJsonBody, stateInvalidResponse } from "@/src/api/route-handler";
import { requireAuthenticatedSession } from "@/src/api/auth";

type InviteAcceptanceRejectionReason =
  | "token-not-found"
  | "invite-revoked"
  | "invite-expired"
  | "invite-already-accepted"
  | "invite-read-only-after-finalization"
  | "identity-already-accepted-for-scope"
  | "invite-race-conflict";

function fromPrismaInviteScope(scope: InviteScope): InviteScopeContract {
  switch (scope) {
    case InviteScope.PARTICIPATION:
      return "participation";
    case InviteScope.LISTENER:
      return "listener";
    case InviteScope.VOTER:
      return "voter";
    default: {
      const _exhaustive: never = scope;
      throw new Error(`Unsupported invite scope: ${_exhaustive}`);
    }
  }
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function rejectionMessage(reason: InviteAcceptanceRejectionReason): string {
  switch (reason) {
    case "token-not-found":
      return "Invite token is invalid.";
    case "invite-revoked":
      return "Invite has been revoked and cannot be accepted.";
    case "invite-expired":
      return "Invite has expired and cannot be accepted.";
    case "invite-already-accepted":
      return "Invite has already been accepted.";
    case "invite-read-only-after-finalization":
      return "Invite links are read-only after showcase finalization.";
    case "identity-already-accepted-for-scope":
      return "Current user already accepted an invite for this scope.";
    case "invite-race-conflict":
      return "Invite acceptance conflicted with another request. Please retry.";
    default: {
      const _exhaustive: never = reason;
      return `Invite acceptance failed: ${_exhaustive}`;
    }
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, INVITE_ACCEPT_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const tokenHash = hashInviteToken(parsedRequest.data.token);
  const now = new Date();

  const invite = await prisma.invite.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      showcaseId: true,
      scope: true,
      acceptedByUserId: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      showcase: {
        select: {
          lifecycleState: true,
        },
      },
    },
  });

  if (!invite) {
    await prisma.inviteAcceptanceAuditEvent.create({
      data: {
        actorUserId: authResult.session.user.sub,
        outcome: InviteAcceptanceOutcome.REJECTED,
        reason: "token-not-found",
        metadata: {
          tokenHash,
        },
      },
    });

    return stateInvalidResponse(rejectionMessage("token-not-found"));
  }

  let rejectionReason: InviteAcceptanceRejectionReason | null = null;

  if (invite.revokedAt) {
    rejectionReason = "invite-revoked";
  } else if (invite.expiresAt && invite.expiresAt <= now) {
    rejectionReason = "invite-expired";
  } else if (invite.acceptedAt || invite.acceptedByUserId) {
    rejectionReason = "invite-already-accepted";
  }

  if (rejectionReason) {
    await prisma.inviteAcceptanceAuditEvent.create({
      data: {
        inviteId: invite.id,
        showcaseId: invite.showcaseId,
        actorUserId: authResult.session.user.sub,
        outcome: InviteAcceptanceOutcome.REJECTED,
        reason: rejectionReason,
      },
    });

    return stateInvalidResponse(rejectionMessage(rejectionReason));
  }

  if (invite.showcase.lifecycleState === ShowcaseLifecycleState.FINALIZED) {
    const auditEvent = await prisma.inviteAcceptanceAuditEvent.create({
      data: {
        inviteId: invite.id,
        showcaseId: invite.showcaseId,
        actorUserId: authResult.session.user.sub,
        outcome: InviteAcceptanceOutcome.REJECTED,
        reason: "invite-read-only-after-finalization",
      },
      select: { id: true },
    });

    const readOnlyResponseBody: InviteAcceptResponse = {
      ok: true,
      data: {
        inviteId: invite.id,
        showcaseId: invite.showcaseId,
        scope: fromPrismaInviteScope(invite.scope),
        resolution: "read-only-after-finalization",
        acceptedByUserId: null,
        acceptedAt: null,
        inviteAcceptanceAuditEventId: auditEvent.id,
      },
    };

    return NextResponse.json(readOnlyResponseBody, { status: 200 });
  }

  const acceptedInviteForScope = await prisma.invite.findFirst({
    where: {
      showcaseId: invite.showcaseId,
      scope: invite.scope,
      acceptedByUserId: authResult.session.user.sub,
      acceptedAt: { not: null },
    },
    select: { id: true },
  });

  if (acceptedInviteForScope) {
    await prisma.inviteAcceptanceAuditEvent.create({
      data: {
        inviteId: invite.id,
        showcaseId: invite.showcaseId,
        actorUserId: authResult.session.user.sub,
        outcome: InviteAcceptanceOutcome.REJECTED,
        reason: "identity-already-accepted-for-scope",
      },
    });

    return stateInvalidResponse(rejectionMessage("identity-already-accepted-for-scope"));
  }

  const acceptance = await prisma.$transaction(async (tx) => {
    const updateResult = await tx.invite.updateMany({
      where: {
        id: invite.id,
        acceptedAt: null,
        acceptedByUserId: null,
        revokedAt: null,
      },
      data: {
        acceptedByUserId: authResult.session.user.sub,
        acceptedAt: now,
      },
    });

    if (updateResult.count !== 1) {
      const auditEvent = await tx.inviteAcceptanceAuditEvent.create({
        data: {
          inviteId: invite.id,
          showcaseId: invite.showcaseId,
          actorUserId: authResult.session.user.sub,
          outcome: InviteAcceptanceOutcome.REJECTED,
          reason: "invite-race-conflict",
        },
        select: { id: true },
      });

      return {
        ok: false as const,
        auditEventId: auditEvent.id,
      };
    }

    const auditEvent = await tx.inviteAcceptanceAuditEvent.create({
      data: {
        inviteId: invite.id,
        showcaseId: invite.showcaseId,
        actorUserId: authResult.session.user.sub,
        outcome: InviteAcceptanceOutcome.ACCEPTED,
      },
      select: { id: true },
    });

    if (invite.scope === InviteScope.PARTICIPATION) {
      await tx.participant.upsert({
        where: {
          showcaseId_userId: {
            showcaseId: invite.showcaseId,
            userId: authResult.session.user.sub,
          },
        },
        create: {
          showcaseId: invite.showcaseId,
          userId: authResult.session.user.sub,
        },
        update: {},
      });
    }

    return {
      ok: true as const,
      auditEventId: auditEvent.id,
    };
  });

  if (!acceptance.ok) {
    return stateInvalidResponse(rejectionMessage("invite-race-conflict"));
  }

  const responseBody: InviteAcceptResponse = {
    ok: true,
    data: {
      inviteId: invite.id,
      showcaseId: invite.showcaseId,
      scope: fromPrismaInviteScope(invite.scope),
      resolution: "accepted",
      acceptedByUserId: authResult.session.user.sub,
      acceptedAt: now,
      inviteAcceptanceAuditEventId: acceptance.auditEventId,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
