-- CreateTable
CREATE TABLE "FinanceReportAdjustment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinanceReportAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceReportAdjustment_reportId_idx" ON "FinanceReportAdjustment"("reportId");

-- CreateIndex
CREATE INDEX "FinanceReportAdjustment_createdAt_idx" ON "FinanceReportAdjustment"("createdAt");

-- AddForeignKey
ALTER TABLE "FinanceReportAdjustment" ADD CONSTRAINT "FinanceReportAdjustment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "FinanceReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
