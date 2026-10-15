/*
  Warnings:

  - Added the required column `payloadXml` to the `Ross1000Transmission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ross1000Transmission" ADD COLUMN     "payloadXml" TEXT NOT NULL;
