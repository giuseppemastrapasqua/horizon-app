-- CreateEnum
CREATE TYPE "RevenueRecommendationStrategy" AS ENUM ('OCCUPANCY', 'BALANCED', 'ADR');

-- CreateEnum
CREATE TYPE "RevenueRecommendationStatus" AS ENUM ('GENERATED', 'APPLIED', 'REJECTED', 'OVERRIDDEN', 'EXPIRED');

-- CreateTable
CREATE TABLE "RevenueMarketSnapshot" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "marketName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "marketAdr" DECIMAL(10,2),
    "marketOccupancy" DECIMAL(5,2),
    "marketRevenue" DECIMAL(12,2),
    "demandIndex" DECIMAL(8,4),
    "bookingPace" DECIMAL(8,4),
    "activeSupply" INTEGER,
    "rawData" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueMarketSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueComparable" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalListingId" TEXT NOT NULL,
    "name" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "distanceKm" DECIMAL(8,3),
    "maxGuests" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "nightlyPrice" DECIMAL(10,2),
    "adr" DECIMAL(10,2),
    "occupancyRate" DECIMAL(5,2),
    "similarityScore" DECIMAL(5,2),
    "rawData" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueComparable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueDailySignal" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "provider" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "marketMedianPrice" DECIMAL(10,2),
    "marketLowPrice" DECIMAL(10,2),
    "marketHighPrice" DECIMAL(10,2),
    "marketOccupancy" DECIMAL(5,2),
    "competitorAvailability" INTEGER,
    "demandIndex" DECIMAL(8,4),
    "leadTimeDays" INTEGER,
    "propertyOccupancy" DECIMAL(5,2),
    "bookingPace" DECIMAL(8,4),
    "gapBeforeNights" INTEGER,
    "gapAfterNights" INTEGER,
    "eventScore" DECIMAL(8,4),
    "confidence" DECIMAL(5,2),
    "factors" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevenueDailySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueRecommendation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "marketSnapshotId" TEXT,
    "strategy" "RevenueRecommendationStrategy" NOT NULL,
    "status" "RevenueRecommendationStatus" NOT NULL DEFAULT 'GENERATED',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "recommendedPrice" DECIMAL(10,2) NOT NULL,
    "lowPrice" DECIMAL(10,2),
    "highPrice" DECIMAL(10,2),
    "minimumStay" INTEGER,
    "confidence" DECIMAL(5,2),
    "rationale" TEXT,
    "factors" JSONB,
    "engineVersion" TEXT NOT NULL,
    "appliedPrice" DECIMAL(10,2),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevenueMarketSnapshot_propertyId_idx" ON "RevenueMarketSnapshot"("propertyId");

-- CreateIndex
CREATE INDEX "RevenueMarketSnapshot_propertyId_capturedAt_idx" ON "RevenueMarketSnapshot"("propertyId", "capturedAt");

-- CreateIndex
CREATE INDEX "RevenueMarketSnapshot_provider_idx" ON "RevenueMarketSnapshot"("provider");

-- CreateIndex
CREATE INDEX "RevenueMarketSnapshot_capturedAt_idx" ON "RevenueMarketSnapshot"("capturedAt");

-- CreateIndex
CREATE INDEX "RevenueComparable_propertyId_idx" ON "RevenueComparable"("propertyId");

-- CreateIndex
CREATE INDEX "RevenueComparable_propertyId_similarityScore_idx" ON "RevenueComparable"("propertyId", "similarityScore");

-- CreateIndex
CREATE INDEX "RevenueComparable_provider_idx" ON "RevenueComparable"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueComparable_propertyId_provider_externalListingId_key" ON "RevenueComparable"("propertyId", "provider", "externalListingId");

-- CreateIndex
CREATE INDEX "RevenueDailySignal_propertyId_idx" ON "RevenueDailySignal"("propertyId");

-- CreateIndex
CREATE INDEX "RevenueDailySignal_propertyId_date_idx" ON "RevenueDailySignal"("propertyId", "date");

-- CreateIndex
CREATE INDEX "RevenueDailySignal_propertyId_date_capturedAt_idx" ON "RevenueDailySignal"("propertyId", "date", "capturedAt");

-- CreateIndex
CREATE INDEX "RevenueDailySignal_provider_idx" ON "RevenueDailySignal"("provider");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_propertyId_idx" ON "RevenueRecommendation"("propertyId");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_propertyId_date_idx" ON "RevenueRecommendation"("propertyId", "date");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_propertyId_date_strategy_idx" ON "RevenueRecommendation"("propertyId", "date", "strategy");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_status_idx" ON "RevenueRecommendation"("status");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_generatedAt_idx" ON "RevenueRecommendation"("generatedAt");

-- CreateIndex
CREATE INDEX "RevenueRecommendation_marketSnapshotId_idx" ON "RevenueRecommendation"("marketSnapshotId");

-- AddForeignKey
ALTER TABLE "RevenueMarketSnapshot" ADD CONSTRAINT "RevenueMarketSnapshot_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueComparable" ADD CONSTRAINT "RevenueComparable_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueDailySignal" ADD CONSTRAINT "RevenueDailySignal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRecommendation" ADD CONSTRAINT "RevenueRecommendation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueRecommendation" ADD CONSTRAINT "RevenueRecommendation_marketSnapshotId_fkey" FOREIGN KEY ("marketSnapshotId") REFERENCES "RevenueMarketSnapshot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
