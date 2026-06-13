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
            scope: InviteScope.LISTENER,
            acceptedByUserId: userId,
            acceptedAt: { not: null },
            revokedAt: null,
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

  const acceptedListenerInvite = await input.prisma.invite.findFirst({
    where: {
      showcaseId: input.showcaseId,
      scope: InviteScope.LISTENER,
      acceptedByUserId: input.userId,
      acceptedAt: { not: null },
      revokedAt: null,
    },
    select: { id: true },
  });

  return evaluateListenPolicy({
    listenerScope: toListenerScope(input.listenerScope),
    isInvited: acceptedListenerInvite !== null,
  });
}
