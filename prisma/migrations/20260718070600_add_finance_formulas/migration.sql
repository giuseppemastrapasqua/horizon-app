-- CreateEnum
CREATE TYPE "FinanceFormulaStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FinanceRuleOperation" AS ENUM ('ADD', 'SUBTRACT');

-- CreateEnum
CREATE TYPE "FinanceRuleValueType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "FinanceRuleBase" AS ENUM ('GROSS_REVENUE', 'CURRENT_TOTAL');

-- CreateTable
CREATE TABLE "FinanceFormula" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FinanceFormulaStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceFormula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceFormulaRule" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "operation" "FinanceRuleOperation" NOT NULL,
    "valueType" "FinanceRuleValueType" NOT NULL,
    "base" "FinanceRuleBase" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceFormulaRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinanceFormula_propertyId_idx" ON "FinanceFormula"("propertyId");

-- CreateIndex
CREATE INDEX "FinanceFormula_status_idx" ON "FinanceFormula"("status");

-- CreateIndex
CREATE INDEX "FinanceFormulaRule_formulaId_idx" ON "FinanceFormulaRule"("formulaId");

-- CreateIndex
CREATE INDEX "FinanceFormulaRule_order_idx" ON "FinanceFormulaRule"("order");

-- AddForeignKey
ALTER TABLE "FinanceFormula" ADD CONSTRAINT "FinanceFormula_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceFormulaRule" ADD CONSTRAINT "FinanceFormulaRule_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "FinanceFormula"("id") ON DELETE CASCADE ON UPDATE CASCADE;
