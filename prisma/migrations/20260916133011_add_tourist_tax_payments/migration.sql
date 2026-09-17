-- CreateEnum
CREATE TYPE "TouristTaxPaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "TouristTaxPaymentProvider" AS ENUM ('STRIPE');

-- CreateTable
CREATE TABLE "TouristTaxPayment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "TouristTaxPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider" "TouristTaxPaymentProvider" NOT NULL,
    "providerPaymentId" TEXT,
    "paymentUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TouristTaxPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TouristTaxPayment_bookingId_idx" ON "TouristTaxPayment"("bookingId");

-- CreateIndex
CREATE INDEX "TouristTaxPayment_status_idx" ON "TouristTaxPayment"("status");

-- CreateIndex
CREATE INDEX "TouristTaxPayment_expiresAt_idx" ON "TouristTaxPayment"("expiresAt");

-- CreateIndex
CREATE INDEX "TouristTaxPayment_paidAt_idx" ON "TouristTaxPayment"("paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "TouristTaxPayment_provider_providerPaymentId_key" ON "TouristTaxPayment"("provider", "providerPaymentId");

-- AddForeignKey
ALTER TABLE "TouristTaxPayment" ADD CONSTRAINT "TouristTaxPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guarantee at most one active PENDING tourist-tax payment per booking.
-- Historical PAID / FAILED / EXPIRED / CANCELLED attempts remain allowed.
CREATE UNIQUE INDEX "TouristTaxPayment_one_pending_per_booking"
ON "TouristTaxPayment" ("bookingId")
WHERE "status" = 'PENDING';
