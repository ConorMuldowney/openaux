import { notFound, redirect } from "next/navigation";
import { ShowcaseDetailContent } from "@/components/showcases/showcase-detail-content";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { SHOWCASE_DETAIL_SELECT, toShowcaseDetailData } from "@/src/api/showcases";
import { evaluateShowcaseReadPolicy } from "@/src/api/showcase-read-access";
import { InviteScope } from "@prisma/client";
import {
  getShowcaseSectionsForRole,
  resolveShowcaseViewerRole,
} from "@/src/modules/showcases/public";

export default async function ShowcasePage({
  params,
}: {
  params: Promise<{ showcaseId: string }>;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/");
  }

  const { showcaseId } = await params;
  const showcase = await prisma.showcase.findUnique({
    where: { id: showcaseId },
    select: SHOWCASE_DETAIL_SELECT,
  });

  if (!showcase) {
    notFound();
  }

  const readDecision = await evaluateShowcaseReadPolicy({
    prisma,
    showcaseId: showcase.id,
    hostUserId: showcase.hostUserId,
    listenerScope: showcase.listenerScope,
    userId: session.user.sub,
  });

  if (!readDecision.allowed) {
    notFound();
  }

  const [participant, voterInvite, ballot] = await Promise.all([
    prisma.participant.findUnique({
      where: { showcaseId_userId: { showcaseId: showcase.id, userId: session.user.sub } },
      select: { id: true },
    }),
    prisma.invite.findFirst({
      where: {
        showcaseId: showcase.id,
        scope: InviteScope.VOTER,
        acceptedByUserId: session.user.sub,
        acceptedAt: { not: null },
        revokedAt: null,
      },
      select: { id: true },
    }),
    prisma.ballot.findUnique({
      where: { showcaseId_voterUserId: { showcaseId: showcase.id, voterUserId: session.user.sub } },
      select: { id: true },
    }),
  ]);

  const role = resolveShowcaseViewerRole({
    hostUserId: showcase.hostUserId,
    userId: session.user.sub,
    isParticipant: participant !== null,
    isVoter: voterInvite !== null || ballot !== null,
  });

  return (
    <ShowcaseDetailContent
      showcase={toShowcaseDetailData(showcase)}
      role={role}
      sections={getShowcaseSectionsForRole(role)}
      userId={session.user.sub}
    />
  );
}