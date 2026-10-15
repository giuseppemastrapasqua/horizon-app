/*
  Warnings:

  - Added the required column `bedsAvailable` to the `Ross1000Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomsAvailable` to the `Ross1000Property` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ross1000Property" ADD COLUMN     "bedsAvailable" INTEGER NOT NULL,
ADD COLUMN     "roomsAvailable" INTEGER NOT NULL;
