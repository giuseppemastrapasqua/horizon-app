-- CreateEnum
CREATE TYPE "PropertyDocumentOcrStatus" AS ENUM ('NOT_REQUESTED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'REVIEW_REQUIRED', 'FAILED');

-- AlterTable
ALTER TABLE "PropertyDocument" ADD COLUMN     "ocrCompletedAt" TIMESTAMP(3),
ADD COLUMN     "ocrError" TEXT,
ADD COLUMN     "ocrExtractedText" TEXT,
ADD COLUMN     "ocrProvider" TEXT,
ADD COLUMN     "ocrProviderVersion" TEXT,
ADD COLUMN     "ocrRequestedAt" TIMESTAMP(3),
ADD COLUMN     "ocrStartedAt" TIMESTAMP(3),
ADD COLUMN     "ocrStatus" "PropertyDocumentOcrStatus" NOT NULL DEFAULT 'NOT_REQUESTED';

-- CreateIndex
CREATE INDEX "PropertyDocument_ocrStatus_idx" ON "PropertyDocument"("ocrStatus");
