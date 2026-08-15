import { ArrowUpRightIcon, BookOpenIcon, CircleHelpIcon, MessageSquareIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DOCUMENTATION_LINKS = [
  {
    title: "Getting started",
    description: "Learn the basics of creating a showcase and inviting participants.",
    href: "/showcases",
    icon: BookOpenIcon,
  },
  {
    title: "Review workflow",
    description: "Understand submissions, voting, and the showcase lifecycle.",
    href: "/showcases",
    icon: CircleHelpIcon,
  },
  {
    title: "Contact support",
    description: "Reach out when you need help with your workspace.",
    href: "mailto:support@openaux.dev",
    icon: MessageSquareIcon,
  },
] as const;

export default function DocumentationPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-4 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b pb-6">
        <p className="text-sm font-medium text-muted-foreground">Support</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Documentation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Find the guidance you need to run a clear, collaborative review workflow.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Documentation resources">
        {DOCUMENTATION_LINKS.map(({ title, description, href, icon: Icon }) => (
          <a
            key={title}
            href={href}
            aria-label={title}
            className="group rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <Icon className="size-5 text-primary" />
                <CardTitle className="mt-2">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center gap-1 text-sm font-medium text-primary">
                Open resource <ArrowUpRightIcon className="size-4" />
              </CardContent>
            </Card>
          </a>
        ))}
      </section>
    </main>
  );
}