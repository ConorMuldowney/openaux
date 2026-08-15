import Link from "next/link";
import { ArrowUpRightIcon, MailBadgeIcon } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function InvitationsPage() {
  return (
    <StandardPageLayout
      eyebrow="Invitations"
      title="All Invitations"
      description="Track invitations sent for showcases in your workspace."
    >
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <MailBadgeIcon className="mt-0.5 size-5 text-primary" />
            <div className="space-y-1">
              <h2 className="font-semibold">No invitations yet</h2>
              <p className="text-sm text-muted-foreground">
                Invitations will appear here when you invite participants, listeners, or voters.
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/showcases">
              Open showcases
              <ArrowUpRightIcon />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}