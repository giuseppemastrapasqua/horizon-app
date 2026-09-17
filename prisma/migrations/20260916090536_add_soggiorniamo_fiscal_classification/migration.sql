-- CreateEnum
CREATE TYPE "SoggiorniamoFiscalClassificationSource" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "SoggiorniamoFiscalClassificationStatus" AS ENUM ('CLASSIFIED', 'REVIEW_REQUIRED');

-- CreateTable
CREATE TABLE "SoggiorniamoFiscalClassification" (
    "id" TEXT NOT NULL,
    "bookingGuestId" TEXT NOT NULL,
    "guestTypeCode" INTEGER,
    "tariff" DECIMAL(10,2),
    "taxAmount" DECIMAL(10,2),
    "intermediary" TEXT,
    "source" "SoggiorniamoFiscalClassificationSource" NOT NULL,
    "status" "SoggiorniamoFiscalClassificationStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoggiorniamoFiscalClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SoggiorniamoFiscalClassification_bookingGuestId_key" ON "SoggiorniamoFiscalClassification"("bookingGuestId");

-- CreateIndex
CREATE INDEX "SoggiorniamoFiscalClassification_status_idx" ON "SoggiorniamoFiscalClassification"("status");

-- CreateIndex
CREATE INDEX "SoggiorniamoFiscalClassification_guestTypeCode_idx" ON "SoggiorniamoFiscalClassification"("guestTypeCode");

-- AddForeignKey
ALTER TABLE "SoggiorniamoFiscalClassification" ADD CONSTRAINT "SoggiorniamoFiscalClassification_bookingGuestId_fkey" FOREIGN KEY ("bookingGuestId") REFERENCES "BookingGuest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
