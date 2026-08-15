import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const LIFECYCLE_LABELS: Record<
  ShowcaseDetailData["lifecycleState"],
  { label: string; badgeVariant: "secondary" | "outline" | "default" }
> = {
  creation: { label: "Creation", badgeVariant: "outline" },
  "submission-open": { label: "Submission Open", badgeVariant: "secondary" },
  "voting-open": { label: "Voting Open", badgeVariant: "secondary" },
  finalized: { label: "Finalized", badgeVariant: "default" },
  voided: { label: "Voided", badgeVariant: "outline" },
  canceled: { label: "Canceled", badgeVariant: "outline" },
};

function formatOptionalDate(value: Date | null): string {
  if (!value) {
    return "Not scheduled";
  }

  return DATE_FORMATTER.format(value);
}

function toScopeLabel(scope: ShowcaseDetailData["participationScope"]): string {
  return scope === "public" ? "Public" : "Invite-only";
}

export type ShowcaseCardViewModel = {
  showcaseId: string;
  title: string;
  lifecycleLabel: string;
  lifecycleBadgeVariant: "secondary" | "outline" | "default";
  relationshipLabel: string;
  participationScopeLabel: string;
  listenerScopeLabel: string;
  voterScopeLabel: string;
  submissionWindowLabel: string;
  votingWindowLabel: string;
  finalizedAtLabel: string;
};

export function toShowcaseCardViewModels(
  showcases: ShowcaseDetailData[],
  currentUserId: string,
): ShowcaseCardViewModel[] {
  return showcases.map((showcase) => {
    const lifecycle = LIFECYCLE_LABELS[showcase.lifecycleState];
    const relationshipLabel = showcase.hostUserId === currentUserId ? "Hosting" : "Participating";

    return {
      showcaseId: showcase.showcaseId,
      title: showcase.title,
      lifecycleLabel: lifecycle.label,
      lifecycleBadgeVariant: lifecycle.badgeVariant,
      relationshipLabel,
      participationScopeLabel: toScopeLabel(showcase.participationScope),
      listenerScopeLabel: toScopeLabel(showcase.listenerScope),
      voterScopeLabel:
        showcase.voterScope === "public-authenticated" ? "Public Authenticated" : "Invite-only Authenticated",
      submissionWindowLabel: `${formatOptionalDate(showcase.submissionOpensAt)} -> ${formatOptionalDate(showcase.submissionClosesAt)}`,
      votingWindowLabel: `${formatOptionalDate(showcase.votingOpensAt)} -> ${formatOptionalDate(showcase.votingClosesAt)}`,
      finalizedAtLabel: formatOptionalDate(showcase.finalizedAt),
    };
  });
}
