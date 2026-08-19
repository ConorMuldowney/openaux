import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, BoxesIcon, CircleDollarSignIcon, CircleHelpIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DOCUMENTATION_PAGES = [
  {
    title: "Getting started",
    description: "Learn how to create a showcase, invite people, and open it for listening, comments, and ranking.",
    href: "/documentation/getting-started",
    action: "Read the guide",
    icon: BookOpenIcon,
  },
  {
    title: "Frequently asked questions",
    description: "Find quick answers about access scopes, Entries, reference samples, voting, and finalization.",
    href: "/documentation/faq",
    action: "Browse the FAQ",
    icon: CircleHelpIcon,
  },
  {
    title: "Costs and upkeep",
    description: "See how OpenAux keeps the service free and how hosting costs may change as usage grows.",
    href: "/documentation/costs",
    action: "View the cost model",
    icon: CircleDollarSignIcon,
  },
  {
    title: "The OpenAux stack",
    description: "See the frameworks, infrastructure, and testing tools that power the app.",
    href: "/documentation/stack",
    action: "View the stack",
    icon: BoxesIcon,
  },
] as const;

export default function DocumentationPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-3 border-b pb-8">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="size-5 text-primary" />
          <Badge variant="secondary">Support</Badge>
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Documentation</h1>
        <p className="max-w-2xl text-base text-foreground/75">
          Choose a guide to learn how OpenAux works, answer common questions, or understand how we keep the service
          free.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Documentation pages">
        {DOCUMENTATION_PAGES.map(({ title, description, href, action, icon: Icon }) => (
          <Card key={title} className="flex h-full flex-col transition-colors hover:bg-muted/40">
            <CardHeader className="flex flex-1 flex-col items-start">
              <Icon className="size-5 text-primary" />
              <CardTitle className="mt-2">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
              <Link
                href={href}
                className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-primary outline-none hover:text-primary/80 focus-visible:rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {action}
                <ArrowRightIcon className="size-4" />
              </Link>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}