import { InviteScope } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import { toUtcDateTimeString } from "@/src/domain/time/public";
import {
  INVITE_LIST_REQUEST_SCHEMA,
  type InviteListResponse,
  type InviteScope as InviteScopeContract,
} from "@/src/api/contracts/invites";
import { parseJsonBody, policyDeniedResponse, stateInvalidResponse } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";

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

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, INVITE_LIST_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedRequest.data.showcaseId },
    select: { id: true, hostUserId: true },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot list invites for Showcase '${parsedRequest.data.showcaseId}' because it does not exist.`,
    );
  }

  if (showcase.hostUserId !== authResult.session.user.sub) {
    return policyDeniedResponse(
      "Only the Host of this Showcase may list invites.",
      "host-membership-required",
    );
  }

  const invites = await prisma.invite.findMany({
    where: {
      showcaseId: parsedRequest.data.showcaseId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      scope: true,
      invitedEmail: true,
      acceptedByUserId: true,
      acceptedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
  });

  const responseBody: InviteListResponse = {
    ok: true,
    data: {
      showcaseId: parsedRequest.data.showcaseId,
      invites: invites.map((invite) => ({
        inviteId: invite.id,
        scope: fromPrismaInviteScope(invite.scope),
        invitedEmail: invite.invitedEmail,
        acceptedByUserId: invite.acceptedByUserId,
        acceptedAt: invite.acceptedAt ? toUtcDateTimeString(invite.acceptedAt) : null,
        expiresAt: invite.expiresAt ? toUtcDateTimeString(invite.expiresAt) : null,
        revokedAt: invite.revokedAt ? toUtcDateTimeString(invite.revokedAt) : null,
        createdAt: toUtcDateTimeString(invite.createdAt),
      })),
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}