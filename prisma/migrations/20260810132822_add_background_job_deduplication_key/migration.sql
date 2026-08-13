-- AlterTable
ALTER TABLE "BackgroundJob" ADD COLUMN     "deduplicationKey" TEXT;

-- CreateIndex
CREATE INDEX "BackgroundJob_type_deduplicationKey_idx" ON "BackgroundJob"("type", "deduplicationKey");
