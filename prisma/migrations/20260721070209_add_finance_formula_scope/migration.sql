-- CreateEnum
CREATE TYPE "FinanceFormulaScope" AS ENUM ('SINGLE_PROPERTY', 'ALL_PROPERTIES');

-- DropForeignKey
ALTER TABLE "FinanceFormula" DROP CONSTRAINT "FinanceFormula_propertyId_fkey";

-- AlterTable
ALTER TABLE "FinanceFormula" ADD COLUMN     "scope" "FinanceFormulaScope" NOT NULL DEFAULT 'SINGLE_PROPERTY',
ALTER COLUMN "propertyId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FinanceFormula_scope_idx" ON "FinanceFormula"("scope");

-- AddForeignKey
ALTER TABLE "FinanceFormula" ADD CONSTRAINT "FinanceFormula_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
