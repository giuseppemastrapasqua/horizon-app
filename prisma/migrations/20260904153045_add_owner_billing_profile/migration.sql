-- CreateEnum
CREATE TYPE "OwnerBillingEntityType" AS ENUM ('PRIVATE', 'VAT_REGISTERED');

-- CreateTable
CREATE TABLE "OwnerBillingProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "entityType" "OwnerBillingEntityType" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "businessName" TEXT,
    "taxCode" TEXT,
    "vatNumber" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IT',
    "email" TEXT NOT NULL,
    "pec" TEXT,
    "recipientCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerBillingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OwnerBillingProfile_ownerId_key" ON "OwnerBillingProfile"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerBillingProfile_entityType_idx" ON "OwnerBillingProfile"("entityType");

-- CreateIndex
CREATE INDEX "OwnerBillingProfile_taxCode_idx" ON "OwnerBillingProfile"("taxCode");

-- CreateIndex
CREATE INDEX "OwnerBillingProfile_vatNumber_idx" ON "OwnerBillingProfile"("vatNumber");

-- AddForeignKey
ALTER TABLE "OwnerBillingProfile" ADD CONSTRAINT "OwnerBillingProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
