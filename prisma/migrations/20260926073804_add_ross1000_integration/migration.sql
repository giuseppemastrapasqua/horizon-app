-- CreateEnum
CREATE TYPE "Ross1000TransmissionStatus" AS ENUM ('PREPARED', 'SENDING', 'CONFIRMED', 'OUTCOME_UNKNOWN', 'REJECTED');

-- CreateTable
CREATE TABLE "Ross1000Transmission" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "status" "Ross1000TransmissionStatus" NOT NULL DEFAULT 'PREPARED',
    "payloadHash" TEXT NOT NULL,
    "responseSuccess" BOOLEAN,
    "responseError" TEXT,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendStartedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "outcomeUnknownAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ross1000Transmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ross1000Account" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usernameEncrypted" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ross1000Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ross1000Property" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "structureCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ross1000Property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Ross1000Transmission_propertyId_idx" ON "Ross1000Transmission"("propertyId");

-- CreateIndex
CREATE INDEX "Ross1000Transmission_movementDate_idx" ON "Ross1000Transmission"("movementDate");

-- CreateIndex
CREATE INDEX "Ross1000Transmission_status_idx" ON "Ross1000Transmission"("status");

-- CreateIndex
CREATE INDEX "Ross1000Transmission_preparedAt_idx" ON "Ross1000Transmission"("preparedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ross1000Transmission_propertyId_movementDate_payloadHash_key" ON "Ross1000Transmission"("propertyId", "movementDate", "payloadHash");

-- CreateIndex
CREATE INDEX "Ross1000Account_ownerId_idx" ON "Ross1000Account"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Ross1000Property_propertyId_key" ON "Ross1000Property"("propertyId");

-- CreateIndex
CREATE INDEX "Ross1000Property_accountId_idx" ON "Ross1000Property"("accountId");

-- CreateIndex
CREATE INDEX "Ross1000Property_propertyId_idx" ON "Ross1000Property"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "Ross1000Property_accountId_structureCode_key" ON "Ross1000Property"("accountId", "structureCode");

-- AddForeignKey
ALTER TABLE "Ross1000Transmission" ADD CONSTRAINT "Ross1000Transmission_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ross1000Account" ADD CONSTRAINT "Ross1000Account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ross1000Property" ADD CONSTRAINT "Ross1000Property_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Ross1000Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ross1000Property" ADD CONSTRAINT "Ross1000Property_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
