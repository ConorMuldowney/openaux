DROP INDEX "Entry_showcaseId_isValid_idx";

ALTER TABLE "Entry"
DROP COLUMN "isValid",
DROP COLUMN "validationDetails";
