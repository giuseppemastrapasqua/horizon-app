-- CreateEnum
CREATE TYPE "AlloggiatiWebTransmissionStatus" AS ENUM (
    'PREPARED',
    'SENDING',
    'CONFIRMED',
    'OUTCOME_UNKNOWN',
    'REJECTED'
);

-- CreateTable
CREATE TABLE "AlloggiatiWebTransmission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "status" "AlloggiatiWebTransmissionStatus" NOT NULL DEFAULT 'PREPARED',
    "payloadHash" TEXT NOT NULL,
    "recordsCount" INTEGER NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendStartedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "outcomeUnknownAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlloggiatiWebTransmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebTransmission_bookingId_payloadHash_key"
ON "AlloggiatiWebTransmission"("bookingId", "payloadHash");

-- CreateIndex
CREATE INDEX "AlloggiatiWebTransmission_propertyId_idx"
ON "AlloggiatiWebTransmission"("propertyId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebTransmission_status_idx"
ON "AlloggiatiWebTransmission"("status");

-- CreateIndex
CREATE INDEX "AlloggiatiWebTransmission_bookingId_idx"
ON "AlloggiatiWebTransmission"("bookingId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebTransmission_preparedAt_idx"
ON "AlloggiatiWebTransmission"("preparedAt");

-- AddForeignKey
ALTER TABLE "AlloggiatiWebTransmission"
ADD CONSTRAINT "AlloggiatiWebTransmission_bookingId_fkey"
FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlloggiatiWebTransmission"
ADD CONSTRAINT "AlloggiatiWebTransmission_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
