import { notFound, redirect } from "next/navigation";
import { NewShowcaseForm } from "@/components/showcases/new-showcase-form";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { SHOWCASE_DETAIL_SELECT, toShowcaseDetailData } from "@/src/api/showcases";

export default async function EditShowcasePage({
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

  if (!showcase || showcase.hostUserId !== session.user.sub) {
    notFound();
  }

  const data = toShowcaseDetailData(showcase);

  return (
    <StandardPageLayout
      eyebrow="Showcases"
      title={`Edit ${data.title}`}
      description="Update the settings and schedule for this showcase."
    >
      <NewShowcaseForm
        alwaysOpen
        showcaseId={data.showcaseId}
        initialValues={{
          title: data.title,
          participationScope: data.participationScope,
          listenerScope: data.listenerScope,
          voterScope: data.voterScope,
          blindJudgingEnabled: data.blindJudgingEnabled,
          maxRankedPicks: data.maxRankedPicks,
          requiredSampleIds: data.requiredSampleIds,
          submissionOpensAt: data.submissionOpensAt?.toISOString(),
          submissionClosesAt: data.submissionClosesAt?.toISOString(),
          votingOpensAt: data.votingOpensAt?.toISOString(),
          votingClosesAt: data.votingClosesAt?.toISOString(),
        }}
      />
    </StandardPageLayout>
  );
}