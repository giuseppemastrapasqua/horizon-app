/*
  Warnings:

  - Added the required column `roomsOccupied` to the `Ross1000BookingData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ross1000BookingData" ADD COLUMN     "roomsOccupied" INTEGER NOT NULL;
