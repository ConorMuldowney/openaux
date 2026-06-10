/**
 * Factory helper functions for creating test data.
 * Used by seed script and test setup/teardown in Vitest and Playwright.
 */

import { PrismaClient } from "@prisma/client";
import type {
  Showcase,
  Participant,
  Entry,
  Invite,
  Ballot,
  BallotVersion,
  ShowcaseLifecycleState,
  AccessScope,
  InviteScope,
} from "@prisma/client";
import { randomUUID } from "crypto";

// Utility: Generate deterministic but unique identifiers for tests
export function createId(): string {
  return randomUUID();
}

export function createEmail(prefix: string): string {
  return `${prefix.replace(/\s+/g, ".")}@openaux.test`;
}

export function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .slice(0, 50);
}

// ============================================================================
// User Factory
// ============================================================================

export interface UserData {
  id: string;
  email: string;
  name: string;
}

/**
 * Create a user-like object for testing (not persisted to DB; used for showcase creation)
 */
export function createUser(
  overrides: Partial<UserData> = {}
): UserData {
  const id = overrides.id || createId();
  const name = overrides.name || `User ${id.slice(0, 8)}`;

  return {
    id,
    name,
    email: overrides.email || createEmail(name),
  };
}

// ============================================================================
// Showcase Factory
// ============================================================================

export interface CreateShowcaseInput {
  title?: string;
  slug?: string;
  hostUserId?: string;
  lifecycleState?: ShowcaseLifecycleState;
  participationScope?: AccessScope;
  listenerScope?: AccessScope;
  voterScope?: AccessScope;
  blindJudgingEnabled?: boolean;
  maxRankedPicks?: number;
  requiredSampleIds?: string[];
  submissionOpensAt?: Date;
  submissionClosesAt?: Date;
  votingOpensAt?: Date;
  votingClosesAt?: Date;
  finalizedAt?: Date;
}

/**
 * Create a showcase with realistic defaults for a given lifecycle state
 */
export async function createShowcase(
  prisma: PrismaClient,
  overrides: CreateShowcaseInput = {}
): Promise<Showcase> {
  const now = new Date();
  const hostUserId = overrides.hostUserId || createUser().id;
  const title = overrides.title || `Showcase ${createId().slice(0, 8)}`;
  const slug = overrides.slug || createSlug(title);
  const lifecycleState = overrides.lifecycleState || "CREATION";

  // Set up realistic dates based on lifecycle state
  let submissionOpensAt = overrides.submissionOpensAt;
  let submissionClosesAt = overrides.submissionClosesAt;
  let votingOpensAt = overrides.votingOpensAt;
  let votingClosesAt = overrides.votingClosesAt;
  let finalizedAt = overrides.finalizedAt;

  if (lifecycleState !== "CREATION") {
    submissionOpensAt = submissionOpensAt || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    submissionClosesAt =
      submissionClosesAt || new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
  }

  if (
    lifecycleState === "VOTING_OPEN" ||
    lifecycleState === "FINALIZED" ||
    lifecycleState === "VOIDED" ||
    lifecycleState === "CANCELED"
  ) {
    votingOpensAt = votingOpensAt || new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    votingClosesAt = votingClosesAt || new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
  }

  if (lifecycleState === "FINALIZED") {
    finalizedAt = finalizedAt || new Date(now.getTime() - 10 * 60 * 60 * 1000); // 10 hours ago
  }

  return prisma.showcase.create({
    data: {
      title,
      slug,
      hostUserId,
      lifecycleState,
      participationScope: overrides.participationScope || "PRIVATE",
      listenerScope: overrides.listenerScope || "PRIVATE",
      voterScope: overrides.voterScope || "PRIVATE",
      blindJudgingEnabled: overrides.blindJudgingEnabled !== false,
      maxRankedPicks: overrides.maxRankedPicks || 3,
      requiredSampleIds: JSON.stringify(overrides.requiredSampleIds || []),
      submissionOpensAt,
      submissionClosesAt,
      votingOpensAt,
      votingClosesAt,
      finalizedAt,
    },
  });
}

// ============================================================================
// Invite Factory
// ============================================================================

export interface CreateInviteInput {
  showcaseId: string;
  scope: InviteScope;
  invitedByUserId?: string;
  invitedEmail?: string;
  acceptedByUserId?: string;
  acceptedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

/**
 * Create an invite token hash (simplified for testing)
 */
function createTokenHash(): string {
  return Buffer.from(randomUUID()).toString("hex");
}

export async function createInvite(
  prisma: PrismaClient,
  input: CreateInviteInput
): Promise<Invite> {
  const invitedByUserId = input.invitedByUserId || createUser().id;

  return prisma.invite.create({
    data: {
      showcaseId: input.showcaseId,
      scope: input.scope,
      tokenHash: createTokenHash(),
      invitedByUserId,
      invitedEmail: input.invitedEmail,
      acceptedByUserId: input.acceptedByUserId,
      acceptedAt: input.acceptedAt,
      expiresAt: input.expiresAt,
      revokedAt: input.revokedAt,
    },
  });
}

// ============================================================================
// Participant Factory
// ============================================================================

export interface CreateParticipantInput {
  showcaseId: string;
  userId?: string;
  joinedAt?: Date;
}

export async function createParticipant(
  prisma: PrismaClient,
  input: CreateParticipantInput
): Promise<Participant> {
  const userId = input.userId || createUser().id;

  return prisma.participant.create({
    data: {
      showcaseId: input.showcaseId,
      userId,
      joinedAt: input.joinedAt,
    },
  });
}

// ============================================================================
// Entry Factory
// ============================================================================

export interface CreateEntryInput {
  showcaseId: string;
  participantId: string;
  storageKey?: string;
  submittedAt?: Date;
  isValid?: boolean;
  validationDetails?: Record<string, unknown>;
}

export async function createEntry(
  prisma: PrismaClient,
  input: CreateEntryInput
): Promise<Entry> {
  const storageKey =
    input.storageKey ||
    `s3://openaux-entries/${input.showcaseId}/${input.participantId}/track.mp3`;

  return prisma.entry.create({
    data: {
      showcaseId: input.showcaseId,
      participantId: input.participantId,
      storageKey,
      submittedAt: input.submittedAt,
      isValid: input.isValid !== false,
      validationDetails: input.validationDetails
        ? JSON.stringify(input.validationDetails)
        : null,
    },
  });
}

// ============================================================================
// Ballot Factory
// ============================================================================

export interface CreateBallotInput {
  showcaseId: string;
  voterUserId?: string;
  currentVersionId?: string;
}

export async function createBallot(
  prisma: PrismaClient,
  input: CreateBallotInput
): Promise<Ballot> {
  const voterUserId = input.voterUserId || createUser().id;

  return prisma.ballot.create({
    data: {
      showcaseId: input.showcaseId,
      voterUserId,
      currentVersionId: input.currentVersionId,
    },
  });
}

// ============================================================================
// Ballot Version Factory
// ============================================================================

export interface CreateBallotVersionInput {
  ballotId: string;
  versionNumber?: number;
  rankedParticipantIds: string[];
  createdAt?: Date;
}

export async function createBallotVersion(
  prisma: PrismaClient,
  input: CreateBallotVersionInput
): Promise<BallotVersion> {
  const versionNumber = input.versionNumber || 1;

  return prisma.ballotVersion.create({
    data: {
      ballotId: input.ballotId,
      versionNumber,
      rankedParticipantIds: JSON.stringify(input.rankedParticipantIds),
      createdAt: input.createdAt,
    },
  });
}

// ============================================================================
// Composite Factories for Common Test Scenarios
// ============================================================================

/**
 * Create a complete showcase in CREATION state with host
 */
export async function createShowcaseCreation(
  prisma: PrismaClient,
  overrides: CreateShowcaseInput = {}
): Promise<{ showcase: Showcase; host: UserData }> {
  const host = createUser();
  const showcase = await createShowcase(prisma, {
    ...overrides,
    hostUserId: host.id,
    lifecycleState: "CREATION",
  });

  return { showcase, host };
}

/**
 * Create a complete showcase in SUBMISSION_OPEN state with participants and entries
 */
export async function createShowcaseWithSubmissions(
  prisma: PrismaClient,
  participantCount: number = 3,
  overrides: CreateShowcaseInput = {}
): Promise<{
  showcase: Showcase;
  host: UserData;
  participants: Array<{ user: UserData; participant: Participant; entry: Entry }>;
}> {
  const host = createUser();
  const showcase = await createShowcase(prisma, {
    ...overrides,
    hostUserId: host.id,
    lifecycleState: "SUBMISSION_OPEN",
  });

  const participants = [];
  for (let i = 0; i < participantCount; i++) {
    const user = createUser({ name: `Participant ${i + 1}` });
    const participant = await createParticipant(prisma, {
      showcaseId: showcase.id,
      userId: user.id,
    });
    const entry = await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: participant.id,
      isValid: true,
    });

    participants.push({ user, participant, entry });
  }

  return { showcase, host, participants };
}

/**
 * Create a complete showcase in VOTING_OPEN state with participants, entries, and ballots
 */
export async function createShowcaseWithVoting(
  prisma: PrismaClient,
  participantCount: number = 3,
  voterCount: number = 5,
  overrides: CreateShowcaseInput = {}
): Promise<{
  showcase: Showcase;
  host: UserData;
  participants: Array<{ user: UserData; participant: Participant; entry: Entry }>;
  voters: Array<UserData>;
  ballots: Array<{
    voter: UserData;
    ballot: Ballot;
    version: BallotVersion;
  }>;
}> {
  const host = createUser();
  
  // Create showcase in VOTING_OPEN state
  const showcase = await createShowcase(prisma, {
    ...overrides,
    hostUserId: host.id,
    lifecycleState: "VOTING_OPEN",
  });

  // Create participants with entries
  const participants = [];
  for (let i = 0; i < participantCount; i++) {
    const user = createUser({ name: `Participant ${i + 1}` });
    const participant = await createParticipant(prisma, {
      showcaseId: showcase.id,
      userId: user.id,
    });
    const entry = await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: participant.id,
      isValid: true,
    });

    participants.push({ user, participant, entry });
  }

  // Create voters with ballots
  const voters: UserData[] = [];
  const ballots = [];

  for (let i = 0; i < voterCount; i++) {
    const voter = createUser({ name: `Voter ${i + 1}` });
    voters.push(voter);

    const ballot = await createBallot(prisma, {
      showcaseId: showcase.id,
      voterUserId: voter.id,
    });

    // Create a ballot version with ranked participants
    const rankedIds = participants
      .slice(0, Math.min(showcase.maxRankedPicks, participants.length))
      .map((p) => p.participant.id);

    const version = await createBallotVersion(prisma, {
      ballotId: ballot.id,
      versionNumber: 1,
      rankedParticipantIds: rankedIds,
    });

    // Link the ballot to its current version
    await prisma.ballot.update({
      where: { id: ballot.id },
      data: { currentVersionId: version.id },
    });

    ballots.push({
      voter,
      ballot: { ...ballot, currentVersionId: version.id },
      version,
    });
  }

  return { showcase, host, participants, voters, ballots };
}

/**
 * Create a complete finalized showcase with all data
 */
export async function createFinalizedShowcase(
  prisma: PrismaClient,
  participantCount: number = 3,
  voterCount: number = 5,
  overrides: CreateShowcaseInput = {}
): Promise<{
  showcase: Showcase;
  host: UserData;
  participants: Array<{ user: UserData; participant: Participant; entry: Entry }>;
  voters: Array<UserData>;
  ballots: Array<{
    voter: UserData;
    ballot: Ballot;
    version: BallotVersion;
  }>;
}> {
  const host = createUser();
  
  // Create showcase in FINALIZED state
  const showcase = await createShowcase(prisma, {
    ...overrides,
    hostUserId: host.id,
    lifecycleState: "FINALIZED",
    finalizedAt: overrides.finalizedAt || new Date(),
  });

  // Create participants with entries
  const participants = [];
  for (let i = 0; i < participantCount; i++) {
    const user = createUser({ name: `Participant ${i + 1}` });
    const participant = await createParticipant(prisma, {
      showcaseId: showcase.id,
      userId: user.id,
    });
    const entry = await createEntry(prisma, {
      showcaseId: showcase.id,
      participantId: participant.id,
      isValid: true,
    });

    participants.push({ user, participant, entry });
  }

  // Create voters with ballots
  const voters: UserData[] = [];
  const ballots = [];

  for (let i = 0; i < voterCount; i++) {
    const voter = createUser({ name: `Voter ${i + 1}` });
    voters.push(voter);

    const ballot = await createBallot(prisma, {
      showcaseId: showcase.id,
      voterUserId: voter.id,
    });

    // Create a ballot version with ranked participants
    const rankedIds = participants
      .slice(0, Math.min(showcase.maxRankedPicks, participants.length))
      .map((p) => p.participant.id);

    const version = await createBallotVersion(prisma, {
      ballotId: ballot.id,
      versionNumber: 1,
      rankedParticipantIds: rankedIds,
    });

    // Link the ballot to its current version
    await prisma.ballot.update({
      where: { id: ballot.id },
      data: { currentVersionId: version.id },
    });

    ballots.push({
      voter,
      ballot: { ...ballot, currentVersionId: version.id },
      version,
    });
  }

  return { showcase, host, participants, voters, ballots };
}
