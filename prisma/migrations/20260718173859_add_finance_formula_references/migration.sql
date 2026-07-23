-- AlterEnum
ALTER TYPE "FinanceRuleValueType" ADD VALUE 'FORMULA';

-- AlterTable
ALTER TABLE "FinanceFormulaRule" ADD COLUMN     "referencedFormulaId" TEXT;

-- CreateIndex
CREATE INDEX "FinanceFormulaRule_referencedFormulaId_idx" ON "FinanceFormulaRule"("referencedFormulaId");

-- AddForeignKey
ALTER TABLE "FinanceFormulaRule" ADD CONSTRAINT "FinanceFormulaRule_referencedFormulaId_fkey" FOREIGN KEY ("referencedFormulaId") REFERENCES "FinanceFormula"("id") ON DELETE SET NULL ON UPDATE CASCADE;
