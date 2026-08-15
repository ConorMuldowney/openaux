import { redirect } from "next/navigation";
import { InviteScope } from "@prisma/client";
import { auth0 } from "@/src/auth/auth0";
import { prisma } from "@/src/db/prisma";
import { SHOWCASE_DETAIL_SELECT, toShowcaseDetailData } from "@/src/api/showcases";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

const LIFECYCLE_BADGE_VARIANT: Record<ShowcaseDetailData["lifecycleState"], "secondary" | "outline" | "default"> = {
  creation: "outline",
  "submission-open": "secondary",
  "voting-open": "secondary",
  finalized: "default",
  voided: "outline",
  canceled: "outline",
};

// Populated by the Auth0 Post-Login Action; not part of the default ID token claims.
const AUTH0_USERNAME_CLAIM = "https://openaux.net/username";

export default async function HomePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/");
  }

  const userId = session.user.sub;
  const username = (session.user as Record<string, unknown>)[AUTH0_USERNAME_CLAIM] as
    | string
    | undefined;

  const showcases = await prisma.showcase.findMany({
    where: {
      OR: [
        { hostUserId: userId },
        {
          invites: {
            some: {
              acceptedByUserId: userId,
              acceptedAt: { not: null },
              revokedAt: null,
              scope: { in: [InviteScope.PARTICIPATION, InviteScope.VOTER, InviteScope.LISTENER] },
            },
          },
        },
      ],
    },
    select: SHOWCASE_DETAIL_SELECT,
    orderBy: { createdAt: "desc" },
  });

  const showcaseData = showcases.map(toShowcaseDetailData);

  console.log(session)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Home</p>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {username ?? session.user.nickname ?? session.user.name ?? session.user.email ?? "there"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button asChild size="sm" variant="outline">
            <a href="/auth/logout">Logout</a>
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold">Your Showcases</h2>
        {showcaseData.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm text-foreground/75">
                You have not hosted or joined any showcases yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseData.map((showcase: ShowcaseDetailData) => (
              <Card key={showcase.showcaseId} size="sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{showcase.title}</h3>
                    <Badge variant={LIFECYCLE_BADGE_VARIANT[showcase.lifecycleState]}>
                      {showcase.lifecycleState}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/75">
                    {showcase.hostUserId === userId ? "You are hosting" : "You are participating"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
