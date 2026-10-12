/*
  Warnings:

  - A unique constraint covering the columns `[ross1000Idswh]` on the table `BookingGuest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BookingGuest" ADD COLUMN     "ross1000Idswh" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BookingGuest_ross1000Idswh_key" ON "BookingGuest"("ross1000Idswh");
