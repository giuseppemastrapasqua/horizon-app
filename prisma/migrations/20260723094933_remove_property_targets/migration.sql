/*
  Warnings:

  - You are about to drop the column `monthlyTarget` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `stretchTarget` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "monthlyTarget",
DROP COLUMN "stretchTarget";
