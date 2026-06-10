-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AccessScope" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "InviteScope" AS ENUM ('PARTICIPATION', 'LISTENER', 'VOTER');

-- CreateEnum
CREATE TYPE "ShowcaseLifecycleState" AS ENUM ('CREATION', 'SUBMISSION_OPEN', 'VOTING_OPEN', 'FINALIZED', 'VOIDED', 'CANCELED');

-- CreateTable
CREATE TABLE "Showcase" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "lifecycleState" "ShowcaseLifecycleState" NOT NULL DEFAULT 'CREATION',
    "participationScope" "AccessScope" NOT NULL,
    "listenerScope" "AccessScope" NOT NULL,
    "voterScope" "AccessScope" NOT NULL,
    "blindJudgingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRankedPicks" INTEGER NOT NULL,
    "requiredSampleIds" JSONB NOT NULL,
    "submissionOpensAt" TIMESTAMP(3),
    "submissionClosesAt" TIMESTAMP(3),
    "votingOpensAt" TIMESTAMP(3),
    "votingClosesAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Showcase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "scope" "InviteScope" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "invitedEmail" TEXT,
    "acceptedByUserId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationDetails" JSONB,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "voterUserId" TEXT NOT NULL,
    "currentVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotVersion" (
    "id" UUID NOT NULL,
    "ballotId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "rankedParticipantIds" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BallotVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransitionAuditEvent" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "actorUserId" TEXT,
    "fromState" "ShowcaseLifecycleState",
    "toState" "ShowcaseLifecycleState" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransitionAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisqualificationEvent" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisqualificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Showcase_slug_key" ON "Showcase"("slug");

-- CreateIndex
CREATE INDEX "Showcase_hostUserId_idx" ON "Showcase"("hostUserId");

-- CreateIndex
CREATE INDEX "Showcase_lifecycleState_idx" ON "Showcase"("lifecycleState");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_showcaseId_scope_idx" ON "Invite"("showcaseId", "scope");

-- CreateIndex
CREATE UNIQUE INDEX "invite_single_use_per_identity_scope" ON "Invite"("showcaseId", "scope", "acceptedByUserId");

-- CreateIndex
CREATE INDEX "Participant_userId_idx" ON "Participant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "participant_unique_identity_per_showcase" ON "Participant"("showcaseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "participant_id_showcase_unique" ON "Participant"("id", "showcaseId");

-- CreateIndex
CREATE INDEX "Entry_showcaseId_isValid_idx" ON "Entry"("showcaseId", "isValid");

-- CreateIndex
CREATE UNIQUE INDEX "entry_one_final_per_participant" ON "Entry"("participantId", "showcaseId");

-- CreateIndex
CREATE UNIQUE INDEX "entry_id_showcase_unique" ON "Entry"("id", "showcaseId");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_currentVersionId_key" ON "Ballot"("currentVersionId");

-- CreateIndex
CREATE INDEX "Ballot_showcaseId_idx" ON "Ballot"("showcaseId");

-- CreateIndex
CREATE INDEX "Ballot_voterUserId_idx" ON "Ballot"("voterUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ballot_single_root_per_voter" ON "Ballot"("showcaseId", "voterUserId");

-- CreateIndex
CREATE INDEX "BallotVersion_ballotId_createdAt_idx" ON "BallotVersion"("ballotId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ballot_version_sequence_unique" ON "BallotVersion"("ballotId", "versionNumber");

-- CreateIndex
CREATE INDEX "TransitionAuditEvent_showcaseId_occurredAt_idx" ON "TransitionAuditEvent"("showcaseId", "occurredAt");

-- CreateIndex
CREATE INDEX "DisqualificationEvent_showcaseId_occurredAt_idx" ON "DisqualificationEvent"("showcaseId", "occurredAt");

-- CreateIndex
CREATE INDEX "DisqualificationEvent_entryId_idx" ON "DisqualificationEvent"("entryId");

-- CreateIndex
CREATE INDEX "DisqualificationEvent_participantId_idx" ON "DisqualificationEvent"("participantId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_participantId_showcaseId_fkey" FOREIGN KEY ("participantId", "showcaseId") REFERENCES "Participant"("id", "showcaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "BallotVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotVersion" ADD CONSTRAINT "BallotVersion_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransitionAuditEvent" ADD CONSTRAINT "TransitionAuditEvent_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisqualificationEvent" ADD CONSTRAINT "DisqualificationEvent_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisqualificationEvent" ADD CONSTRAINT "DisqualificationEvent_entryId_showcaseId_fkey" FOREIGN KEY ("entryId", "showcaseId") REFERENCES "Entry"("id", "showcaseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisqualificationEvent" ADD CONSTRAINT "DisqualificationEvent_participantId_showcaseId_fkey" FOREIGN KEY ("participantId", "showcaseId") REFERENCES "Participant"("id", "showcaseId") ON DELETE RESTRICT ON UPDATE CASCADE;

