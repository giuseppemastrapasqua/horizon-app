/*
  Warnings:

  - You are about to drop the column `propertyId` on the `AlloggiatiWebReceipt` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accountId,receiptDate]` on the table `AlloggiatiWebReceipt` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AlloggiatiWebReceipt" DROP CONSTRAINT "AlloggiatiWebReceipt_propertyId_fkey";

-- DropIndex
DROP INDEX "AlloggiatiWebReceipt_accountId_propertyId_receiptDate_key";

-- DropIndex
DROP INDEX "AlloggiatiWebReceipt_propertyId_idx";

-- AlterTable
ALTER TABLE "AlloggiatiWebReceipt" DROP COLUMN "propertyId";

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebReceipt_accountId_receiptDate_key" ON "AlloggiatiWebReceipt"("accountId", "receiptDate");
