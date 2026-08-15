import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, CircleDollarSignIcon, CircleHelpIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COST_ROWS = [
  {
    service: "OpenAux users",
    purpose: "Access to the app",
    target: "$0",
    fallback: "No subscriptions, donations, or paid user access",
  },
  {
    service: "Vercel",
    purpose: "App hosting and deployment",
    target: "$0 / month",
    fallback: "A paid plan may be needed for usage or commercial-plan requirements",
  },
  {
    service: "Supabase",
    purpose: "Database and storage",
    target: "$0 / month",
    fallback: "The paid plan starts at the provider's current published rate if free limits are exceeded",
  },
  {
    service: "Auth0",
    purpose: "Authentication and accounts",
    target: "$0 / month",
    fallback: "Usage-based pricing may apply after the free allowance",
  },
] as const;

const GROWTH_SCENARIOS = [
  {
    users: "Up to 1,000",
    vercel: "$0",
    supabase: "$0",
    auth0: "$0",
    total: "$0 / user / month",
  },
  {
    users: "1,000–10,000",
    vercel: "$0–$20",
    supabase: "$0–$25",
    auth0: "$0+",
    total: "Up to ~$0.05 / user / month",
  },
  {
    users: "10,000+",
    vercel: "Review usage",
    supabase: "$25+",
    auth0: "Usage-based",
    total: "Provider-dependent / user",
  },
] as const;

export default function CostsPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <CircleDollarSignIcon className="size-5 text-primary" />
            <Badge variant="secondary">Documentation</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Costs and upkeep</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/75">
              OpenAux is designed to stay free. There is no subscription, no donation request, and no charge for
              using the app. We publish the operating costs so the model stays transparent.
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

      <Card>
        <CardHeader>
          <CardTitle>Target monthly cost</CardTitle>
          <CardDescription>
            Our goal is $0 per month while the app fits within the providers&apos; free allowances and eligible plans.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>What it covers</TableHead>
                <TableHead>Target cost</TableHead>
                <TableHead>When cost may change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COST_ROWS.map(({ service, purpose, target, fallback }) => (
                <TableRow key={service}>
                  <TableCell className="font-semibold">{service}</TableCell>
                  <TableCell className="text-muted-foreground">{purpose}</TableCell>
                  <TableCell className="font-semibold text-primary">{target}</TableCell>
                  <TableCell className="min-w-64 text-muted-foreground">{fallback}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Cost principles">
        <Card className="bg-muted/30">
          <CardHeader>
            <CircleHelpIcon className="size-5 text-primary" />
            <CardTitle className="mt-2">What affects the bill?</CardTitle>
            <CardDescription>
              User count alone does not set the cost. Traffic, database size, storage, deployments, and monthly active
              users determine whether a provider&apos;s free allowance is enough.
            </CardDescription>
          </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="growth-scenarios">
                  <AccordionTrigger>Show cost scenarios by monthly active users</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-4 leading-6 text-muted-foreground">
                      These are planning ranges, not provider quotes. Monthly active users are signed-in users who use
                      the app during a month; traffic and storage can move the numbers earlier or later.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Monthly active users</TableHead>
                          <TableHead>Vercel</TableHead>
                          <TableHead>Supabase</TableHead>
                          <TableHead>Auth0</TableHead>
                          <TableHead>Estimated cost per user</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {GROWTH_SCENARIOS.map(({ users, vercel, supabase, auth0, total }) => (
                          <TableRow key={users}>
                            <TableCell className="font-semibold">{users}</TableCell>
                            <TableCell>{vercel}</TableCell>
                            <TableCell>{supabase}</TableCell>
                            <TableCell>{auth0}</TableCell>
                            <TableCell className="font-semibold text-primary">{total}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>How we handle growth</CardTitle>
            <CardDescription>
              We will monitor usage before changing plans, document any unavoidable cost, and keep the app free rather
              than introducing donations or subscriptions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              <AccordionItem value="operating-model">
                <AccordionTrigger>Read our operating model</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 leading-6 text-muted-foreground">
                    <p>
                      OpenAux is maintained by a one-person team. Keeping the service within free allowances is the
                      simplest way to keep it running without subscriptions, donations, or a separate fundraising
                      operation.
                    </p>
                    <p>
                      OpenAux will only take on higher operating costs when necessary to make ends meet, never to
                      generate profit. Any change will be documented here before it happens.
                    </p>
                    <p>
                      If you have any recommendations on how OpenAux can cut costs, <a href="mailto:support@openaux.dev" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">get in touch</a>.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <Button asChild variant="link" className="mt-3 w-fit px-0">
              <Link href="/documentation/faq">
                Read the FAQ
                <ArrowRightIcon />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <p className="text-sm text-muted-foreground">
        Provider prices and free allowances can change. This page describes our intended operating model, not a price
        guarantee from Vercel, Supabase, or Auth0.
      </p>
    </main>
  );
}