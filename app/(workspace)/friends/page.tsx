import { UsersRoundIcon } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Card, CardContent } from "@/components/ui/card";

export default function FriendsPage() {
  return (
    <StandardPageLayout
      eyebrow="Friends"
      title="All Friends"
      description="Connect with people you collaborate with across your showcases."
    >
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <UsersRoundIcon className="mt-0.5 size-5 text-primary" />
            <div className="space-y-1">
              <h2 className="font-semibold">No friends yet</h2>
              <p className="text-sm text-muted-foreground">
                Friends and collaborators will appear here when you connect with them.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </StandardPageLayout>
  );
}
