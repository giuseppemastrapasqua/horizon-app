/*
  Warnings:

  - A unique constraint covering the columns `[propertyId,referenceMonth]` on the table `FinanceReport` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "FinanceReportTemplate" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Rendiconto Horizon',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "headerTitle" TEXT NOT NULL DEFAULT 'Rendiconto proprietario',
    "primaryColor" TEXT NOT NULL DEFAULT '#2563EB',
    "logoUrl" TEXT,
    "showBookingDetails" BOOLEAN NOT NULL DEFAULT true,
    "showOtaCommissions" BOOLEAN NOT NULL DEFAULT true,
    "showCleaningCosts" BOOLEAN NOT NULL DEFAULT true,
    "showManagementFees" BOOLEAN NOT NULL DEFAULT true,
    "showTaxes" BOOLEAN NOT NULL DEFAULT true,
    "showManualAdjustments" BOOLEAN NOT NULL DEFAULT true,
    "showCategorySummary" BOOLEAN NOT NULL DEFAULT true,
    "footerText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceReportTemplate_propertyId_key" ON "FinanceReportTemplate"("propertyId");

-- CreateIndex
CREATE INDEX "FinanceReportTemplate_isDefault_idx" ON "FinanceReportTemplate"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "FinanceReport_propertyId_referenceMonth_key" ON "FinanceReport"("propertyId", "referenceMonth");

-- AddForeignKey
ALTER TABLE "FinanceReportTemplate" ADD CONSTRAINT "FinanceReportTemplate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
