-- CreateEnum
CREATE TYPE "FinanceRuleCategory" AS ENUM (
    'OTA_COMMISSION',
    'VAT',
    'CLEANING',
    'MANAGEMENT_COMMISSION',
    'TAX',
    'OTHER'
);

-- AlterTable
ALTER TABLE "FinanceFormulaRule"
ADD COLUMN "category" "FinanceRuleCategory" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "FinanceReportRule"
ADD COLUMN "category" "FinanceRuleCategory" NOT NULL DEFAULT 'OTHER';