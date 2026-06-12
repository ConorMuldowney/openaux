import { createHash, randomBytes } from "crypto";
import { InviteScope, ShowcaseLifecycleState } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/src/db/prisma";
import {
  INVITE_ISSUE_REQUEST_SCHEMA,
  type InviteIssueResponse,
  type InviteScope as InviteScopeContract,
} from "@/src/api/contracts/invites";
import { parseJsonBody, policyDeniedResponse, stateInvalidResponse } from "@/src/api/route-handler";
import { requireVerifiedEmailSession } from "@/src/api/auth";

function toPrismaInviteScope(scope: InviteScopeContract): InviteScope {
  switch (scope) {
    case "participation":
      return InviteScope.PARTICIPATION;
    case "listener":
      return InviteScope.LISTENER;
    case "voter":
      return InviteScope.VOTER;
    default: {
      const _exhaustive: never = scope;
      throw new Error(`Unsupported invite scope: ${_exhaustive}`);
    }
  }
}

function createInviteToken(): string {
  return randomBytes(24).toString("hex");
}

function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createShareableInviteUrl(request: Request, token: string): string {
  const inviteUrl = new URL("/invites/accept", request.url);
  inviteUrl.searchParams.set("token", token);
  return inviteUrl.toString();
}

export async function POST(request: Request) {
  const authResult = await requireVerifiedEmailSession(request);
  if (!authResult.ok) {
    return authResult.response;
  }

  const parsedRequest = await parseJsonBody(request, INVITE_ISSUE_REQUEST_SCHEMA);
  if (!parsedRequest.ok) {
    return parsedRequest.response;
  }

  if (parsedRequest.data.expiresAt && parsedRequest.data.expiresAt <= new Date()) {
    return stateInvalidResponse("Invite expiry must be in the future.");
  }

  const showcase = await prisma.showcase.findUnique({
    where: { id: parsedRequest.data.showcaseId },
    select: { id: true, hostUserId: true, lifecycleState: true },
  });

  if (!showcase) {
    return stateInvalidResponse(
      `Cannot issue invite for Showcase '${parsedRequest.data.showcaseId}' because it does not exist.`,
    );
  }

  if (showcase.hostUserId !== authResult.session.user.sub) {
    return policyDeniedResponse(
      "Only the Host of this Showcase may issue invites.",
      "host-membership-required",
    );
  }

  if (showcase.lifecycleState === ShowcaseLifecycleState.FINALIZED) {
    return stateInvalidResponse("Cannot issue invites for finalized showcases.");
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);
  const invite = await prisma.invite.create({
    data: {
      showcaseId: parsedRequest.data.showcaseId,
      scope: toPrismaInviteScope(parsedRequest.data.scope),
      tokenHash,
      invitedByUserId: authResult.session.user.sub,
      invitedEmail: parsedRequest.data.invitedEmail,
      expiresAt: parsedRequest.data.expiresAt,
    },
    select: {
      id: true,
      showcaseId: true,
      scope: true,
      expiresAt: true,
    },
  });

  const responseBody: InviteIssueResponse = {
    ok: true,
    data: {
      inviteId: invite.id,
      showcaseId: invite.showcaseId,
      scope: parsedRequest.data.scope,
      token,
      inviteUrl: createShareableInviteUrl(request, token),
      expiresAt: invite.expiresAt,
    },
  };

  return NextResponse.json(responseBody, { status: 200 });
}
