import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { NewShowcaseForm } from "@/components/showcases/new-showcase-form";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";
import type { ShowcaseSection, ShowcaseViewerRole } from "@/src/modules/showcases/public";

type ShowcaseDetailContentProps = {
  showcase: ShowcaseDetailData;
  role: ShowcaseViewerRole;
  sections: ShowcaseSection[];
};

const SECTION_DESCRIPTIONS: Record<ShowcaseSection, string> = {
  submission: "Submit and manage the required showcase samples.",
  entries: "Review submitted entries and their validation status.",
  listening: "Listen to the available showcase entries.",
  voting: "Rank eligible entries and submit your ballot.",
  participants: "View the people taking part in this showcase.",
} as const;

function formatDate(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(value)
    : "Not scheduled";
}

function ShowcaseInfo({ showcase }: { showcase: ShowcaseDetailData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Showcase information</CardTitle>
      </CardHeader>
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
            <ul className="mt-2 space-y-1">
              {showcase.requiredSampleIds.map((sample) => (
                <li key={sample} className="break-all text-sm">
                  {sample.startsWith("http://") || sample.startsWith("https://") ? (
                    <a
                      href={sample}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline underline-offset-2"
                    >
                      {sample}
                    </a>
                  ) : (
                    sample
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-foreground/75">No required samples configured.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ShowcaseSectionCard({ name }: { name: ShowcaseSection }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="capitalize">{name}</CardTitle>
        <Badge variant="outline">Available</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/75">{SECTION_DESCRIPTIONS[name]}</p>
      </CardContent>
    </Card>
  );
}

export function ShowcaseDetailContent({ showcase, role, sections }: ShowcaseDetailContentProps) {
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

      <ShowcaseInfo showcase={showcase} />
      <section className="grid gap-4 md:grid-cols-2" aria-label="Showcase areas">
        {sections.map((section) => (
          <ShowcaseSectionCard key={section} name={section} />
        ))}
      </section>
    </StandardPageLayout>
  );
}