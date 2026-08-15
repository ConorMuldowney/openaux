import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, BoxesIcon, Code2Icon, DatabaseIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STACK_GROUPS = [
  {
    title: "Application",
    icon: Code2Icon,
    items: [
      ["Next.js", "Full-stack framework for routes, server rendering, and API handlers."],
      ["TypeScript", "Typed application code and shared contracts."],
    ],
  },
  {
    title: "Interface",
    icon: BoxesIcon,
    items: [
      ["Tailwind CSS", "Utility-first styling with semantic theme tokens."],
      ["shadcn/ui", "Composable UI primitives built with Radix and Base UI."],
      ["Lucide", "Consistent icons throughout the workspace."],
    ],
  },
  {
    title: "Data and identity",
    icon: DatabaseIcon,
    items: [
      ["Supabase Postgres", "Hosted PostgreSQL database and storage foundation."],
      ["Prisma", "Type-safe database access, migrations, and seed data."],
      ["Auth0", "Authentication and account identity."],
    ],
  },
  {
    title: "Delivery and confidence",
    icon: ShieldCheckIcon,
    items: [
      ["Vercel", "Deployment and production hosting."],
      ["Vitest", "Unit and integration test runner."],
      ["Playwright", "End-to-end browser testing."],
    ],
  },
] as const;

export default function StackPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <BoxesIcon className="size-5 text-primary" />
            <Badge variant="secondary">Documentation</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">The OpenAux stack</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/75">
              The tools behind the app, from the Next.js workspace and UI layer to the database, authentication,
              deployment, and test systems.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href="/documentation/getting-started">
            <BookOpenIcon />
            Getting started
          </Link>
        </Button>
      </header>

      <section className="grid gap-6 md:grid-cols-2" aria-label="OpenAux technology stack">
        {STACK_GROUPS.map(({ title, icon: Icon, items }) => (
          <Card key={title} className="h-full">
            <CardHeader>
              <Icon className="size-5 text-primary" />
              <CardTitle className="mt-2">{title}</CardTitle>
              <CardDescription>Core tools used in this part of OpenAux.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map(([name, description]) => (
                <div key={name} className="border-l-2 border-primary/30 pl-4">
                  <h2 className="font-semibold">{name}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle>Why this stack?</CardTitle>
          <CardDescription>
            It keeps the product small to operate, strongly typed, easy to test, and compatible with the free-by-default
            cost model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="link" className="w-fit px-0">
            <Link href="/documentation/costs">
              Read about costs and upkeep
              <ArrowRightIcon />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}