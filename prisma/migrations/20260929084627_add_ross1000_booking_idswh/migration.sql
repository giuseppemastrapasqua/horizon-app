/*
  Warnings:

  - A unique constraint covering the columns `[ross1000Idswh]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "ross1000Idswh" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_ross1000Idswh_key" ON "Booking"("ross1000Idswh");
