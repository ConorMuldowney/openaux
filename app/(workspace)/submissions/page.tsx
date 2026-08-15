import Link from "next/link";
import { ArrowUpRightIcon, FileTextIcon } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function SubmissionsPage() {
  return (
    <StandardPageLayout
      eyebrow="Submissions"
      title="All Submissions"
      description="Review and manage entries submitted to showcases in your workspace."
    >
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
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
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}