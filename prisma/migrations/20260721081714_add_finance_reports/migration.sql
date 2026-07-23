-- CreateTable
CREATE TABLE "FinanceReport" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "formulaId" TEXT,
    "createdById" TEXT,
    "referenceMonth" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "grossRevenue" DECIMAL(12,2) NOT NULL,
    "finalAmount" DECIMAL(12,2) NOT NULL,
    "formulaName" TEXT NOT NULL,
    "formulaSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceReportRule" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "sourceRuleId" TEXT,
    "order" INTEGER NOT NULL,
    "ruleName" TEXT NOT NULL,
    "operation" "FinanceRuleOperation" NOT NULL,
    "valueType" "FinanceRuleValueType" NOT NULL,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "configuredValue" DECIMAL(12,2) NOT NULL,
    "calculatedAmount" DECIMAL(12,2) NOT NULL,
    "totalBefore" DECIMAL(12,2) NOT NULL,
    "totalAfter" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceReportRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceReport_propertyId_idx" ON "FinanceReport"("propertyId");

-- CreateIndex
CREATE INDEX "FinanceReport_ownerId_idx" ON "FinanceReport"("ownerId");

-- CreateIndex
CREATE INDEX "FinanceReport_formulaId_idx" ON "FinanceReport"("formulaId");

-- CreateIndex
CREATE INDEX "FinanceReport_createdById_idx" ON "FinanceReport"("createdById");

-- CreateIndex
CREATE INDEX "FinanceReport_referenceMonth_idx" ON "FinanceReport"("referenceMonth");

-- CreateIndex
CREATE INDEX "FinanceReport_createdAt_idx" ON "FinanceReport"("createdAt");

-- CreateIndex
CREATE INDEX "FinanceReportRule_reportId_idx" ON "FinanceReportRule"("reportId");

-- CreateIndex
CREATE INDEX "FinanceReportRule_sourceRuleId_idx" ON "FinanceReportRule"("sourceRuleId");

-- CreateIndex
CREATE INDEX "FinanceReportRule_order_idx" ON "FinanceReportRule"("order");

-- AddForeignKey
ALTER TABLE "FinanceReport" ADD CONSTRAINT "FinanceReport_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceReport" ADD CONSTRAINT "FinanceReport_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceReport" ADD CONSTRAINT "FinanceReport_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "FinanceFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceReport" ADD CONSTRAINT "FinanceReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceReportRule" ADD CONSTRAINT "FinanceReportRule_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FinanceReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
