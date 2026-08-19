import { NewSubmissionForm } from "@/components/submissions/new-submission-form";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";

export default async function NewSubmissionPage({
  searchParams,
}: {
  searchParams?: Promise<{ showcaseId?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <StandardPageLayout
      className="min-h-0"
      eyebrow="Submissions"
      title="Share your work"
      description="Add the details and audio file for your new submission."
    >
      <NewSubmissionForm showcaseId={params.showcaseId ?? null} />
    </StandardPageLayout>
  );
}