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
    service: "Vercel",
    purpose: "App hosting and deployment",
    target: "$0 / month",
    fallback: "A paid plan may be needed for usage or commercial-plan requirements",
  },
  {
    service: "Neon",
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
  {
    service: "Cloudflare R2",
    purpose: "Private media storage in the dev and prod buckets",
    target: "$0 / month",
    fallback: "Storage and request volume may be billed; egress is currently free",
  },
  {
    service: "Terraform Cloud",
    purpose: "Remote state for infrastructure provisioning",
    target: "$0 / month",
    fallback: "The free tier covers the current workspace; paid features or usage may change this",
  },
  {
    service: "Sentry",
    purpose: "Error monitoring and optional performance traces",
    target: "$0 / month",
    fallback: "Issue volume, trace volume, and retention may exceed the free allowance",
  },
  {
    service: "GitHub Actions",
    purpose: "Continuous integration and infrastructure deployment",
    target: "$0 / month",
    fallback: "Private-repository minutes and artifact storage may be billed after the included allowance",
  },
] as const;

const COST_DRIVERS = [
  {
    driver: "Application traffic",
    services: "Vercel, Neon",
    effect: "Requests, bandwidth, compute time, and database egress can move usage beyond free allowances.",
  },
  {
    driver: "Authenticated users",
    services: "Auth0",
    effect: "Monthly active users and authentication features determine usage-based charges.",
  },
  {
    driver: "Media volume",
    services: "Cloudflare R2",
    effect: "Stored audio, upload/download requests, and retained normalized files drive storage usage.",
  },
  {
    driver: "Observability volume",
    services: "Sentry",
    effect: "Errors, performance traces, and retention determine whether monitoring remains within free limits.",
  },
  {
    driver: "Automation volume",
    services: "GitHub Actions, Terraform Cloud",
    effect: "Workflow minutes, artifact storage, Terraform runs, and state-management features may incur charges.",
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
              The model includes only services that can generate an operating bill. Free allowances are targets, not
              guarantees, and usage is reviewed before a paid plan is needed.
            </CardDescription>
          </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="growth-scenarios">
                  <AccordionTrigger>Show the main cost drivers</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-4 leading-6 text-muted-foreground">
                      Provider billing is driven by resource usage, not by a single user-count threshold. These are
                      planning categories, not provider quotes.
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Services</TableHead>
                          <TableHead>What can increase cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {COST_DRIVERS.map(({ driver, services, effect }) => (
                          <TableRow key={driver}>
                            <TableCell className="font-semibold">{driver}</TableCell>
                            <TableCell>{services}</TableCell>
                            <TableCell>{effect}</TableCell>
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
        guarantee from any provider listed above.
      </p>
    </main>
  );
}