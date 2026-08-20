-- CreateTable
CREATE TABLE "EntryComment" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "timestampSeconds" DOUBLE PRECISION NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EntryComment_entryId_timestampSeconds_idx" ON "EntryComment"("entryId", "timestampSeconds");

-- CreateIndex
CREATE INDEX "EntryComment_showcaseId_idx" ON "EntryComment"("showcaseId");

-- AddForeignKey
ALTER TABLE "EntryComment" ADD CONSTRAINT "EntryComment_entryId_showcaseId_fkey" FOREIGN KEY ("entryId", "showcaseId") REFERENCES "Entry"("id", "showcaseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntryComment" ADD CONSTRAINT "EntryComment_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
