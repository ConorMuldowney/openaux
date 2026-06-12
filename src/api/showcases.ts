import { AccessScope, ShowcaseLifecycleState, type Prisma, type Showcase } from "@prisma/client";
import type { ShowcaseDetailData } from "@/src/api/contracts/showcases";

export const SHOWCASE_DETAIL_SELECT = {
  id: true,
  slug: true,
  title: true,
  hostUserId: true,
  lifecycleState: true,
  participationScope: true,
  listenerScope: true,
  voterScope: true,
  blindJudgingEnabled: true,
  maxRankedPicks: true,
  requiredSampleIds: true,
  submissionOpensAt: true,
  submissionClosesAt: true,
  votingOpensAt: true,
  votingClosesAt: true,
  finalizedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ShowcaseDetailRecord = Prisma.ShowcaseGetPayload<{
  select: typeof SHOWCASE_DETAIL_SELECT;
}>;

export function toPrismaAccessScope(scope: "public" | "invite-only"): AccessScope {
  return scope === "public" ? AccessScope.PUBLIC : AccessScope.PRIVATE;
}

export function toPrismaVoterScope(
  scope: "public-authenticated" | "invite-only-authenticated",
): AccessScope {
  return scope === "public-authenticated" ? AccessScope.PUBLIC : AccessScope.PRIVATE;
}

function fromPrismaParticipationScope(scope: AccessScope): "public" | "invite-only" {
  return scope === AccessScope.PUBLIC ? "public" : "invite-only";
}

function fromPrismaListenerScope(scope: AccessScope): "public" | "invite-only" {
  return scope === AccessScope.PUBLIC ? "public" : "invite-only";
}

function fromPrismaVoterScope(
  scope: AccessScope,
): "public-authenticated" | "invite-only-authenticated" {
  return scope === AccessScope.PUBLIC ? "public-authenticated" : "invite-only-authenticated";
}

function fromPrismaLifecycleState(
  state: ShowcaseLifecycleState,
):
  | "creation"
  | "submission-open"
  | "voting-open"
  | "finalized"
  | "voided"
  | "canceled" {
  switch (state) {
    case ShowcaseLifecycleState.CREATION:
      return "creation";
    case ShowcaseLifecycleState.SUBMISSION_OPEN:
      return "submission-open";
    case ShowcaseLifecycleState.VOTING_OPEN:
      return "voting-open";
    case ShowcaseLifecycleState.FINALIZED:
      return "finalized";
    case ShowcaseLifecycleState.VOIDED:
      return "voided";
    case ShowcaseLifecycleState.CANCELED:
      return "canceled";
    default: {
      const exhaustive: never = state;
      throw new Error(`Unsupported lifecycle state: ${exhaustive}`);
    }
  }
}

function normalizeRequiredSampleIds(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function toShowcaseDetailData(showcase: ShowcaseDetailRecord): ShowcaseDetailData {
  return {
    showcaseId: showcase.id,
    slug: showcase.slug,
    title: showcase.title,
    hostUserId: showcase.hostUserId,
    lifecycleState: fromPrismaLifecycleState(showcase.lifecycleState),
    participationScope: fromPrismaParticipationScope(showcase.participationScope),
    listenerScope: fromPrismaListenerScope(showcase.listenerScope),
    voterScope: fromPrismaVoterScope(showcase.voterScope),
    blindJudgingEnabled: showcase.blindJudgingEnabled,
    maxRankedPicks: showcase.maxRankedPicks,
    requiredSampleIds: normalizeRequiredSampleIds(showcase.requiredSampleIds),
    submissionOpensAt: showcase.submissionOpensAt,
    submissionClosesAt: showcase.submissionClosesAt,
    votingOpensAt: showcase.votingOpensAt,
    votingClosesAt: showcase.votingClosesAt,
    finalizedAt: showcase.finalizedAt,
    createdAt: showcase.createdAt,
    updatedAt: showcase.updatedAt,
  };
}

export function createSlugBase(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  if (slug.length === 0) {
    return "showcase";
  }

  return slug.slice(0, 64);
}

export async function generateUniqueShowcaseSlug(
  prisma: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
  title: string,
): Promise<string> {
  const base = createSlugBase(title);
  const existing = await prisma.showcase.findUnique({ where: { slug: base }, select: { id: true } });

  if (!existing) {
    return base;
  }

  for (let suffix = 2; suffix <= 9999; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${base.slice(0, Math.max(1, 64 - suffixText.length))}${suffixText}`;
    const candidateExisting = await prisma.showcase.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!candidateExisting) {
      return candidate;
    }
  }

  throw new Error("Unable to generate a unique showcase slug.");
}

export function isShowcaseSettingsLocked(showcase: Pick<Showcase, "lifecycleState" | "submissionOpensAt">): boolean {
  if (showcase.lifecycleState !== ShowcaseLifecycleState.CREATION) {
    return true;
  }

  if (showcase.submissionOpensAt && showcase.submissionOpensAt <= new Date()) {
    return true;
  }

  return false;
}
