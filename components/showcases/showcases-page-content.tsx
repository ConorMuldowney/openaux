import Link from "next/link";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ShowcaseCardViewModel } from "@/src/modules/showcases/public";

type ShowcasesPageContentProps = {
  showcases: ShowcaseCardViewModel[];
};

function ScopeLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-xs text-foreground/75">
      <span className="font-semibold text-foreground">{label}:</span> {value}
    </p>
  );
}

export function ShowcasesPageContent({ showcases }: ShowcasesPageContentProps) {
  return (
    <StandardPageLayout
      eyebrow="Showcases"
      title="All Accessible Showcases"
      description={(
        <>
          Review lifecycle state, access scopes, and schedule windows for each showcase.
        </>
      )}
      actions={(
        <Button asChild>
          <Link href="/showcases/new">Create New Showcase</Link>
        </Button>
      )}
    >
      {showcases.length === 0 ? (
        <Card>
          <CardContent className="space-y-2 p-5">
            <p className="text-sm text-foreground/75">No showcases are currently visible to your account.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {showcases.map((showcase) => (
            <Card key={showcase.showcaseId} size="sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="line-clamp-2 text-base font-bold">{showcase.title}</h2>
                  <Badge variant={showcase.lifecycleBadgeVariant}>{showcase.lifecycleLabel}</Badge>
                </div>

                <p className="text-sm text-foreground/75">{showcase.relationshipLabel}</p>

                <div className="space-y-1.5">
                  <ScopeLine label="Participation" value={showcase.participationScopeLabel} />
                  <ScopeLine label="Listening" value={showcase.listenerScopeLabel} />
                  <ScopeLine label="Voting" value={showcase.voterScopeLabel} />
                </div>

                <div className="space-y-1.5 border-t pt-3">
                  <ScopeLine label="Submission Window" value={showcase.submissionWindowLabel} />
                  <ScopeLine label="Voting Window" value={showcase.votingWindowLabel} />
                  <ScopeLine label="Finalized" value={showcase.finalizedAtLabel} />
                </div>

                {showcase.relationshipLabel === "Hosting" ? (
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={`/showcases/${showcase.showcaseId}`}>Edit Showcase</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </StandardPageLayout>
  );
}
