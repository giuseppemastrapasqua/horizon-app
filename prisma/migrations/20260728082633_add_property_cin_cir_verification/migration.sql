-- CreateEnum
CREATE TYPE "PropertyCodeVerificationStatus" AS ENUM ('NOT_VERIFIED', 'PENDING', 'VERIFIED', 'NOT_FOUND', 'MISMATCH', 'REVIEW_REQUIRED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "cin" TEXT,
ADD COLUMN     "cir" TEXT,
ADD COLUMN     "codeVerificationNotes" TEXT,
ADD COLUMN     "codeVerificationStatus" "PropertyCodeVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
ADD COLUMN     "codeVerifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Property_cin_idx" ON "Property"("cin");

-- CreateIndex
CREATE INDEX "Property_cir_idx" ON "Property"("cir");

-- CreateIndex
CREATE INDEX "Property_codeVerificationStatus_idx" ON "Property"("codeVerificationStatus");
