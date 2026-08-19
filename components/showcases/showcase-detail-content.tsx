import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { NewShowcaseForm } from "@/components/showcases/new-showcase-form";
import { SamplePreview } from "@/components/showcases/sample-preview";
import {
  EntriesBallotList,
  type ShowcaseEntryListItem,
} from "@/components/showcases/entries-ballot-list";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";
import type { ShowcaseSection, ShowcaseViewerRole } from "@/src/modules/showcases/public";
import { createSampleDownloadUrl, createEntryDownloadUrl } from "@/src/storage/public";
import { shouldRevealParticipantIdentity } from "@/src/modules/visibility/public";
import { prisma } from "@/src/db/prisma";
import { ChevronDown } from "lucide-react";

type ShowcaseDetailContentProps = {
  showcase: ShowcaseDetailData;
  role: ShowcaseViewerRole;
  sections: ShowcaseSection[];
  userId: string;
};

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(value)
    : "Not scheduled";
}

// Voided/canceled showcases have no further lifecycle transitions, so treat them like
// finalized for the purpose of deciding whether blind-judged identities are revealed.
function toVisibilityLifecycleState(
  lifecycleState: ShowcaseDetailData["lifecycleState"],
): "creation" | "submission-open" | "voting-open" | "finalized" {
  if (lifecycleState === "voided" || lifecycleState === "canceled") {
    return "finalized";
  }
  return lifecycleState;
}

async function ShowcaseInfo({ showcase }: { showcase: ShowcaseDetailData }) {
  const sampleDownloadUrls = await Promise.all(
    showcase.requiredSampleIds.map((sample) =>
      sample.startsWith("s3://") ? createSampleDownloadUrl(sample) : null,
    ),
  );

  return (
    <Collapsible defaultOpen>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="group flex w-full items-center justify-between text-left">
            <span className="text-base leading-snug font-medium">Showcase information</span>
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/75">Lifecycle</p>
          <p className="mt-1 font-medium capitalize">{showcase.lifecycleState.replaceAll("-", " ")}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/75">Submission window</p>
          <p className="mt-1 font-medium">
            {formatDate(showcase.submissionOpensAt)} - {formatDate(showcase.submissionClosesAt)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/75">Voting window</p>
          <p className="mt-1 font-medium">
            {formatDate(showcase.votingOpensAt)} - {formatDate(showcase.votingClosesAt)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/75">Ranked picks</p>
          <p className="mt-1 font-medium">Up to {showcase.maxRankedPicks}</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/75">Required samples</p>
          {showcase.requiredSampleIds.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {showcase.requiredSampleIds.map((sample, index) => (
                <li key={sample} className="rounded-lg border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Sample {index + 1}</p>
                  <SamplePreview
                    sample={sample}
                    audioFileUrl={sampleDownloadUrls[index]?.downloadUrl}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-foreground/75">No required samples configured.</p>
          )}
        </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

async function ShowcaseEntriesSection({
  showcase,
  userId,
  canSubmit,
  canVote,
}: {
  showcase: ShowcaseDetailData;
  userId: string;
  canSubmit: boolean;
  canVote: boolean;
}) {
  const entries = await prisma.entry.findMany({
    where: { showcaseId: showcase.showcaseId },
    select: {
      id: true,
      title: true,
      description: true,
      storageKey: true,
      isValid: true,
      participant: { select: { id: true } },
    },
    orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
  });

  const revealIdentity = shouldRevealParticipantIdentity({
    isBlindJudgingEnabled: showcase.blindJudgingEnabled,
    lifecycleState: toVisibilityLifecycleState(showcase.lifecycleState),
  });

  const items: ShowcaseEntryListItem[] = await Promise.all(
    entries.map(async (entry, index) => ({
      entryId: entry.id,
      title: entry.title,
      description: entry.description,
      participantId: revealIdentity ? entry.participant.id : null,
      participantAlias: revealIdentity ? null : `Participant ${index + 1}`,
      audioDownloadUrl: (await createEntryDownloadUrl(entry.storageKey))?.downloadUrl ?? null,
      isValidForRequiredSamples: entry.isValid,
    })),
  );

  let initialRankedEntryIds: string[] = [];
  if (canVote) {
    const ballot = await prisma.ballot.findUnique({
      where: { showcaseId_voterUserId: { showcaseId: showcase.showcaseId, voterUserId: userId } },
      select: { currentVersion: { select: { rankedParticipantIds: true } } },
    });

    const rankedParticipantIds =
      (ballot?.currentVersion?.rankedParticipantIds as string[] | undefined) ?? [];
    const participantIdToEntryId = new Map(
      entries.map((entry) => [entry.participant.id, entry.id]),
    );
    initialRankedEntryIds = rankedParticipantIds
      .map((participantId) => participantIdToEntryId.get(participantId))
      .filter((entryId): entryId is string => Boolean(entryId));
  }

  return (
    <EntriesBallotList
      showcaseId={showcase.showcaseId}
      entries={items}
      canSubmit={canSubmit}
      canVote={canVote}
      maxRankedPicks={showcase.maxRankedPicks}
      initialRankedEntryIds={initialRankedEntryIds}
    />
  );
}

export function ShowcaseDetailContent({ showcase, role, sections, userId }: ShowcaseDetailContentProps) {
  return (
    <StandardPageLayout
      eyebrow={`${role} view`}
      title={role === "host" ? `Edit ${showcase.title}` : showcase.title}
      description={
        role === "host"
          ? "Manage showcase settings and access every showcase area."
          : "Explore the showcase areas available to your role."
      }
    >
      {role === "host" ? (
        <NewShowcaseForm
          alwaysOpen
          showcaseId={showcase.showcaseId}
          initialValues={{
            title: showcase.title,
            participationScope: showcase.participationScope,
            listenerScope: showcase.listenerScope,
            voterScope: showcase.voterScope,
            blindJudgingEnabled: showcase.blindJudgingEnabled,
            maxRankedPicks: showcase.maxRankedPicks,
            requiredSampleIds: showcase.requiredSampleIds,
            submissionOpensAt: showcase.submissionOpensAt?.toISOString(),
            submissionClosesAt: showcase.submissionClosesAt?.toISOString(),
            votingOpensAt: showcase.votingOpensAt?.toISOString(),
            votingClosesAt: showcase.votingClosesAt?.toISOString(),
          }}
        />
      ) : null}

      {role !== "host" ? <ShowcaseInfo showcase={showcase} /> : null}
      <section aria-label="Showcase areas">
        <ShowcaseEntriesSection
          showcase={showcase}
          userId={userId}
          canSubmit={sections.includes("submission")}
          canVote={sections.includes("voting")}
        />
      </section>
    </StandardPageLayout>
  );
}
