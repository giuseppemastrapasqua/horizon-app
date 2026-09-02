ALTER TYPE "AlloggiatiWebTransmissionStatus"
ADD VALUE 'PARTIALLY_CONFIRMED';

ALTER TABLE "AlloggiatiWebTransmission"
ADD COLUMN "acceptedRecords" INTEGER,
ADD COLUMN "partiallyConfirmedAt" TIMESTAMP(3);