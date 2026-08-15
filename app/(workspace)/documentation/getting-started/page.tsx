import Link from "next/link";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  FileTextIcon,
  MailBadgeIcon,
  MessageSquareIcon,
  PanelTopIcon,
  UsersRoundIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_START_STEPS = [
  {
    number: "01",
    title: "Create a showcase",
    description: "Set a title, access scopes, required samples, and the submission and voting windows.",
    href: "/showcases/new",
    action: "Create showcase",
    icon: PanelTopIcon,
  },
  {
    number: "02",
    title: "Invite the right people",
    description: "Use the configured scopes to decide who can participate, listen, and cast ballots.",
    href: "/invitations",
    action: "View invitations",
    icon: MailBadgeIcon,
  },
  {
    number: "03",
    title: "Open the showcase",
    description: "Make the showcase available to everyone or selected Participants so they can listen, comment, and rank Entries.",
    href: "/showcases",
    action: "Open showcases",
    icon: FileTextIcon,
  },
] as const;

const WORKFLOW_DOCUMENTS = [
  {
    title: "Host a showcase",
    description: "A practical guide to planning a showcase, choosing access rules, and setting a fair schedule.",
    icon: PanelTopIcon,
    href: "/showcases/new",
    linkLabel: "Start hosting",
  },
  {
    title: "Participate in a showcase",
    description: "Learn how invitations, Required Samples, and one final Entry fit together for Participants.",
    icon: UsersRoundIcon,
    href: "/showcases",
    linkLabel: "Browse showcases",
  },
  {
    title: "Listen, comment, and rank",
    description: "Understand how public or selected Participants engage with Entries through listening, comments, and Ranked Ballots.",
    icon: CheckCircle2Icon,
    href: "/showcases",
    linkLabel: "Open showcases",
  },
] as const;

const SHOWCASE_TERMS = [
  ["Host", "The authenticated user who creates and configures a showcase."],
  ["Participant", "An invited authenticated user who submits one final Entry."],
  ["Entry", "A Participant's submitted track for a specific showcase."],
  ["Required Sample", "A sample that must be used for an Entry to be valid."],
  ["Ranked Ballot", "A ballot where a voter ranks up to the configured number of Participants."],
  ["Blind Judging", "A mode that hides creator identities during active phases."],
] as const;

export default function GettingStartedPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <BookOpenIcon className="size-5 text-primary" />
            <Badge variant="secondary">Getting started</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Run your first showcase</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/75">
              OpenAux keeps a showcase moving from setup to finalization. Use this guide to configure the room,
              open it to the right people, and give them a clear way to engage with Entries.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild>
            <Link href="/showcases/new">
              Create showcase
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/showcases">Browse showcases</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-4" aria-labelledby="quick-start-heading">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">The short version</p>
          <h2 id="quick-start-heading" className="mt-1 text-2xl font-bold tracking-tight">Three steps to get moving</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {QUICK_START_STEPS.map(({ number, title, description, href, action, icon: Icon }) => (
            <Card key={title} className="flex h-full flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black tracking-widest text-accent">{number}</span>
                  <Icon className="size-5 text-primary" />
                </div>
                <CardTitle className="mt-2">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild variant="ghost" className="px-0 text-primary hover:bg-transparent hover:text-primary/80">
                  <Link href={href}>
                    {action}
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]" aria-label="Documentation guides">
        <Card>
          <CardHeader>
            <CardTitle>Guides for each role</CardTitle>
            <CardDescription>Jump into the part of the workflow you are responsible for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {WORKFLOW_DOCUMENTS.map(({ title, description, icon: Icon, href, linkLabel }) => (
              <div key={title} className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                <Icon className="size-5 text-primary" />
                <div className="space-y-2">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
                <Button asChild variant="link" className="mt-auto w-fit px-0">
                  <Link href={href}>
                    {linkLabel}
                    <ArrowRightIcon />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How phases work</CardTitle>
            <CardDescription>Every showcase follows a predictable sequence.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["Submission", "Participants add Entries while the submission window is open."],
              ["Open", "The public or selected Participants listen, comment, and submit a Ranked Ballot."],
              ["Finalized", "When voting closes, the showcase becomes immutable and results can publish."],
            ].map(([phase, description], index) => (
              <div key={phase} className="flex gap-3">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{phase}</h3>
                  <p className="text-sm leading-5 text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 border-t pt-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]" aria-label="Reference and support">
        <Card>
          <CardHeader>
            <CardTitle>OpenAux vocabulary</CardTitle>
            <CardDescription>The terms you will see throughout a showcase.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {SHOWCASE_TERMS.map(([term, description]) => (
              <div key={term} className="space-y-1">
                <h3 className="text-sm font-semibold">{term}</h3>
                <p className="text-sm leading-5 text-muted-foreground">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardHeader>
            <CircleHelpIcon className="size-5 text-primary" />
            <CardTitle className="mt-2">Need a hand?</CardTitle>
            <CardDescription>We can help you get a showcase ready for its first phase.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/documentation/faq">
                  FAQ
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/documentation/costs">
                  Costs and upkeep
                  <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <a href="mailto:support@openaux.dev">
                  <MessageSquareIcon />
                  Contact support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}