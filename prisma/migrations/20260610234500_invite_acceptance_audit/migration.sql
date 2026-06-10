-- CreateEnum
CREATE TYPE "InviteAcceptanceOutcome" AS ENUM ('ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "InviteAcceptanceAuditEvent" (
    "id" UUID NOT NULL,
    "inviteId" UUID,
    "showcaseId" UUID,
    "actorUserId" TEXT,
    "outcome" "InviteAcceptanceOutcome" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InviteAcceptanceAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InviteAcceptanceAuditEvent_showcaseId_occurredAt_idx" ON "InviteAcceptanceAuditEvent"("showcaseId", "occurredAt");

-- CreateIndex
CREATE INDEX "InviteAcceptanceAuditEvent_inviteId_occurredAt_idx" ON "InviteAcceptanceAuditEvent"("inviteId", "occurredAt");

-- AddForeignKey
ALTER TABLE "InviteAcceptanceAuditEvent" ADD CONSTRAINT "InviteAcceptanceAuditEvent_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "Invite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InviteAcceptanceAuditEvent" ADD CONSTRAINT "InviteAcceptanceAuditEvent_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
