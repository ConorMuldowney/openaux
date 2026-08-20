import { AccessScope, InviteScope, type Prisma } from "@prisma/client";
import { evaluateListenPolicy, type PolicyDecision } from "@/src/modules/policy/public";

function toListenerScope(scope: AccessScope): "public" | "invite-only" {
  return scope === AccessScope.PUBLIC ? "public" : "invite-only";
}

export function buildShowcaseReadWhere(userId?: string): Prisma.ShowcaseWhereInput {
  if (!userId) {
    return {
      listenerScope: AccessScope.PUBLIC,
    };
  }

  return {
    OR: [
      { listenerScope: AccessScope.PUBLIC },
      { hostUserId: userId },
      {
        invites: {
          some: {
            scope: { in: [InviteScope.PARTICIPATION, InviteScope.LISTENER, InviteScope.VOTER] },
            acceptedByUserId: userId,
            acceptedAt: { not: null },
            revokedAt: null,
          },
        },
      },
      {
        participants: {
          some: {
            userId,
          },
        },
      },
    ],
  };
}

export function buildHomeShowcaseWhere(userId: string): Prisma.ShowcaseWhereInput {
  return {
    OR: [
      { hostUserId: userId },
      {
        invites: {
          some: {
            acceptedByUserId: userId,
            acceptedAt: { not: null },
            revokedAt: null,
            scope: { in: [InviteScope.PARTICIPATION, InviteScope.VOTER, InviteScope.LISTENER] },
          },
        },
      },
      {
        participants: {
          some: {
            userId,
          },
        },
      },
      {
        ballots: {
          some: {
            voterUserId: userId,
          },
        },
      },
    ],
  };
}

export async function evaluateShowcaseReadPolicy(input: {
  prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient;
  showcaseId: string;
  hostUserId: string;
  listenerScope: AccessScope;
  userId?: string;
}): Promise<PolicyDecision> {
  if (input.userId && input.userId === input.hostUserId) {
    return { allowed: true };
  }

  if (!input.userId) {
    return evaluateListenPolicy({
      listenerScope: toListenerScope(input.listenerScope),
      isInvited: false,
    });
  }

  const [participant, acceptedRoleInvite] = await Promise.all([
    input.prisma.participant.findUnique({
      where: {
        showcaseId_userId: {
          showcaseId: input.showcaseId,
          userId: input.userId,
        },
      },
      select: { id: true },
    }),
    input.prisma.invite.findFirst({
      where: {
        showcaseId: input.showcaseId,
        scope: { in: [InviteScope.PARTICIPATION, InviteScope.LISTENER, InviteScope.VOTER] },
        acceptedByUserId: input.userId,
        acceptedAt: { not: null },
        revokedAt: null,
      },
      select: { id: true },
    }),
  ]);

  return evaluateListenPolicy({
    listenerScope: toListenerScope(input.listenerScope),
    isInvited: participant !== null || acceptedRoleInvite !== null,
  });
}
