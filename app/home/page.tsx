import { redirect } from "next/navigation";
import { getHomePageData } from "@/src/api/home";
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

export default async function HomePage() {
  const homePageData = await getHomePageData();

  if (!homePageData) {
    redirect("/");
  }

  const { displayName, showcases } = homePageData;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">Home</p>
          <h1 className="text-3xl font-black tracking-tight">
            Welcome back, {displayName}
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
        {showcases.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 p-5">
              <p className="text-sm text-foreground/75">
                You have not hosted or joined any showcases yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {showcases.map((showcase) => (
              <Card key={showcase.showcaseId} size="sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{showcase.title}</h3>
                    <Badge variant={LIFECYCLE_BADGE_VARIANT[showcase.lifecycleState]}>
                      {showcase.lifecycleState}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground/75">
                    {showcase.relationship === "hosting" ? "You are hosting" : "You are participating"}
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
