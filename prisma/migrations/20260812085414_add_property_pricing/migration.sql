-- CreateEnum
CREATE TYPE "PricingAdjustmentType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "PricingOverrideSource" AS ENUM ('MANUAL', 'AI', 'RULE');

-- CreateTable
CREATE TABLE "PropertyRatePlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "minimumStay" INTEGER NOT NULL DEFAULT 1,
    "maximumStay" INTEGER,
    "occupancyIncluded" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyRatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyOccupancyPrice" (
    "id" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "guests" INTEGER NOT NULL,
    "adjustmentType" "PricingAdjustmentType" NOT NULL,
    "adjustmentValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOccupancyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyRateRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ratePlanId" TEXT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "daysOfWeek" INTEGER[],
    "adjustmentType" "PricingAdjustmentType",
    "adjustmentValue" DECIMAL(10,2),
    "minimumStay" INTEGER,
    "maximumStay" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyRateRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPriceOverride" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "nightlyPrice" DECIMAL(10,2),
    "minimumStay" INTEGER,
    "maximumStay" INTEGER,
    "source" "PricingOverrideSource" NOT NULL DEFAULT 'MANUAL',
    "createdById" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPriceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyRatePlan_propertyId_idx" ON "PropertyRatePlan"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyRatePlan_propertyId_active_idx" ON "PropertyRatePlan"("propertyId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyRatePlan_propertyId_code_key" ON "PropertyRatePlan"("propertyId", "code");

-- CreateIndex
CREATE INDEX "PropertyOccupancyPrice_ratePlanId_idx" ON "PropertyOccupancyPrice"("ratePlanId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOccupancyPrice_ratePlanId_guests_key" ON "PropertyOccupancyPrice"("ratePlanId", "guests");

-- CreateIndex
CREATE INDEX "PropertyRateRule_propertyId_idx" ON "PropertyRateRule"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyRateRule_ratePlanId_idx" ON "PropertyRateRule"("ratePlanId");

-- CreateIndex
CREATE INDEX "PropertyRateRule_propertyId_active_idx" ON "PropertyRateRule"("propertyId", "active");

-- CreateIndex
CREATE INDEX "PropertyRateRule_startDate_endDate_idx" ON "PropertyRateRule"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PropertyPriceOverride_propertyId_idx" ON "PropertyPriceOverride"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyPriceOverride_propertyId_startDate_endDate_idx" ON "PropertyPriceOverride"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "PropertyPriceOverride_source_idx" ON "PropertyPriceOverride"("source");

-- CreateIndex
CREATE INDEX "PropertyPriceOverride_createdById_idx" ON "PropertyPriceOverride"("createdById");

-- AddForeignKey
ALTER TABLE "PropertyRatePlan" ADD CONSTRAINT "PropertyRatePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOccupancyPrice" ADD CONSTRAINT "PropertyOccupancyPrice_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "PropertyRatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRateRule" ADD CONSTRAINT "PropertyRateRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyRateRule" ADD CONSTRAINT "PropertyRateRule_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "PropertyRatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPriceOverride" ADD CONSTRAINT "PropertyPriceOverride_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPriceOverride" ADD CONSTRAINT "PropertyPriceOverride_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
