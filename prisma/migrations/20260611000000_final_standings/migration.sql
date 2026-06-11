-- CreateTable
CREATE TABLE "FinalStandings" (
    "id" UUID NOT NULL,
    "showcaseId" UUID NOT NULL,
    "standings" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalStandings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinalStandings_showcaseId_key" ON "FinalStandings"("showcaseId");

-- AddForeignKey
ALTER TABLE "FinalStandings" ADD CONSTRAINT "FinalStandings_showcaseId_fkey" FOREIGN KEY ("showcaseId") REFERENCES "Showcase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
