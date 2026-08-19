import Link from "next/link";
import { ArrowUpRightIcon, FileTextIcon } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { createEntryDownloadUrl } from "@/src/storage/public";

export default async function SubmissionsPage() {
  const session = await auth0.getSession();
  const submissions = session
    ? await prisma.entry.findMany({
        where: { participant: { userId: session.user.sub } },
        select: {
          id: true,
          title: true,
          description: true,
          storageKey: true,
          submittedAt: true,
          showcase: { select: { title: true } },
        },
        orderBy: { submittedAt: "desc" },
      })
    : [];

  return (
    <StandardPageLayout
      eyebrow="Submissions"
      title="All Submissions"
      description="Review and manage entries submitted to showcases in your workspace."
    >
      <Card>
        <CardContent className="space-y-4 p-6">
          {submissions.length > 0 ? (
            submissions.map(async (submission) => {
              const audio = await createEntryDownloadUrl(submission.storageKey);

              return (
                <article className="space-y-3 rounded-lg border bg-muted/30 p-4" key={submission.id}>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="font-semibold">{submission.title}</h2>
                    <p className="text-sm text-muted-foreground">{submission.showcase.title}</p>
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={submission.submittedAt.toISOString()}>
                    {submission.submittedAt.toLocaleDateString()}
                  </time>
                </div>
                {submission.description ? <p className="text-sm text-foreground/75">{submission.description}</p> : null}
                {audio ? (
                  <audio
                    className="w-full"
                    controls
                    preload="none"
                    aria-label={`Audio preview for ${submission.title}`}
                    src={audio.downloadUrl}
                  />
                ) : null}
                </article>
              );
            })
          ) : (
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileTextIcon className="mt-0.5 size-5 text-primary" />
            <div className="space-y-1">
              <h2 className="font-semibold">No submissions to review</h2>
              <p className="text-sm text-muted-foreground">
                Submissions will appear here when participants add work to a showcase.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/showcases">
              Browse showcases
              <ArrowUpRightIcon />
            </Link>
          </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}