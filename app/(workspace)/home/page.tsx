import { redirect } from "next/navigation";
import { ArrowUpRightIcon, CheckCircle2Icon, CircleDashedIcon, Clock3Icon, PlusIcon } from "lucide-react";
import { getHomePageData } from "@/src/api/home";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardTrendChart } from "@/components/home/dashboard-trend-chart";
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
  const activeShowcases = showcases.filter(({ lifecycleState }) =>
    lifecycleState === "submission-open" || lifecycleState === "voting-open",
  ).length;
  const completedShowcases = showcases.filter(({ lifecycleState }) => lifecycleState === "finalized").length;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Overview</p>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {displayName}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your showcases.</p>
        </div>
        <Button asChild>
          <a href="/showcases">
            <PlusIcon />
            New showcase
          </a>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total showcases" value={showcases.length.toString()} detail="Across your workspace" icon={CircleDashedIcon} />
        <MetricCard label="Active showcases" value={activeShowcases.toString()} detail="Open for participation" icon={Clock3Icon} />
        <MetricCard label="Completed" value={completedShowcases.toString()} detail="Finalized showcases" icon={CheckCircle2Icon} />
        <MetricCard label="Participation" value={showcases.length ? "100%" : "--"} detail="Your recent activity" icon={ArrowUpRightIcon} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold">Showcase activity</h2>
                <p className="mt-1 text-sm text-muted-foreground">Your showcase activity over the last 6 months.</p>
              </div>
              <Badge variant="secondary">Last 6 months</Badge>
            </div>
            <DashboardTrendChart />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col p-5 sm:p-6">
            <div>
              <h2 className="font-semibold">Quick actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">Keep your review workflow moving.</p>
            </div>
            <div className="mt-6 grid gap-2">
              <Button asChild variant="outline" className="justify-between">
                <a href="/showcases"><span>Browse showcases</span><ArrowUpRightIcon /></a>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <a href="/showcases"><span>Review submissions</span><ArrowUpRightIcon /></a>
              </Button>
              <Button asChild variant="outline" className="justify-between">
                <a href="/showcases"><span>Manage invitations</span><ArrowUpRightIcon /></a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Recent showcases</h2>
            <p className="mt-1 text-sm text-muted-foreground">The latest work in your workspace.</p>
          </div>
          <Button asChild variant="ghost" size="sm"><a href="/showcases">View all <ArrowUpRightIcon /></a></Button>
        </div>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">Showcase</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Open</th></tr>
              </thead>
              <tbody>
                {showcases.length ? showcases.map((showcase) => (
                  <tr key={showcase.showcaseId} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 font-medium">{showcase.title}</td>
                    <td className="px-5 py-4 text-muted-foreground">{showcase.relationship === "hosting" ? "Host" : "Participant"}</td>
                    <td className="px-5 py-4"><Badge variant={LIFECYCLE_BADGE_VARIANT[showcase.lifecycleState]}>{showcase.lifecycleState}</Badge></td>
                    <td className="px-5 py-4 text-right"><Button asChild variant="ghost" size="icon"><a href="/showcases" aria-label={`Open ${showcase.title}`}><ArrowUpRightIcon /></a></Button></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No showcases yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
    </main>
  );
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
