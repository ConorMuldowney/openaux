import Link from "next/link";
import { ArrowRightIcon, BookOpenIcon, CircleHelpIcon, MessageSquareIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FAQ_ITEMS = [
  {
    question: "What is a showcase?",
    answer:
      "A showcase is a time-boxed space where Participants submit Entries and an eligible audience listens, comments, and ranks them. Hosts configure the access rules and the submission and voting windows.",
  },
  {
    question: "Who can take part in a showcase?",
    answer:
      "The Host chooses the Participation Scope, Listener Scope, and Voter Scope. A showcase can be open to everyone or limited to selected Participants and authenticated voters through private Invites.",
  },
  {
    question: "What is the difference between the access scopes?",
    answer:
      "Participation Scope controls who may submit an Entry. Listener Scope controls who may listen and comment. Voter Scope controls which authenticated users may cast a Ranked Ballot. Each scope can be configured independently.",
  },
  {
    question: "What is a Reference Sample?",
    answer:
      "A Reference Sample is optional audio that a Host provides as creative guidance. It does not determine whether an Entry can be ranked.",
  },
  {
    question: "How does ranking work?",
    answer:
      "Eligible voters submit a Ranked Ballot by ordering up to the number of distinct Participants configured by the Host. A voter does not need to rank every available Entry.",
  },
  {
    question: "What does Blind Judging hide?",
    answer:
      "When Blind Judging is enabled, creator identities stay hidden during the active phases. They are revealed when results publish, according to the showcase lifecycle.",
  },
  {
    question: "What happens when voting closes?",
    answer:
      "The showcase reaches Showcase Finalization. Its showcase actions become immutable, and the results can publish from the completed voting phase.",
  },
  {
    question: "How do I get access to a private showcase?",
    answer:
      "Ask the Host for an Invite. Private Invites require authentication before they can be accepted, so make sure you are signed in with the intended account.",
  },
] as const;

const FAQ_GROUPS = [
  {
    title: "Access and participation",
    description: "Who can join, submit, and get into a private showcase.",
    items: FAQ_ITEMS.slice(0, 4),
  },
  {
    title: "Listening and results",
    description: "How people engage with Entries and how a showcase concludes.",
    items: FAQ_ITEMS.slice(4),
  },
] as const;

export default function FrequentlyAskedQuestionsPage() {
  return (
    <main className="flex min-h-full w-full flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-5 border-b pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <CircleHelpIcon className="size-5 text-primary" />
            <Badge variant="secondary">Documentation</Badge>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Frequently asked questions</h1>
            <p className="mt-3 max-w-2xl text-base text-foreground/75">
              Find quick answers about showcase access, participation, listening, comments, ranking, and finalization.
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_18rem]">
        {FAQ_GROUPS.map(({ title, description, items }) => (
          <Card key={title} className="h-fit">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {items.map(({ question, answer }, index) => (
                  <AccordionItem key={question} value={`${title}-${index}`}>
                    <AccordionTrigger>{question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="leading-6 text-muted-foreground">{answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        <Card className="h-fit bg-muted/30">
          <CardHeader>
            <MessageSquareIcon className="size-5 text-primary" />
            <CardTitle className="mt-2">Still have a question?</CardTitle>
            <CardDescription>Get help with your workspace or showcase setup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild>
              <a href="mailto:support@openaux.dev">
                Contact support
                <ArrowRightIcon />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}