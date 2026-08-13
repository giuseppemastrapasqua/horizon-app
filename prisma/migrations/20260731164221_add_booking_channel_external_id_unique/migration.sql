/*
  Warnings:

  - A unique constraint covering the columns `[channel,externalBookingId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_channel_externalBookingId_key" ON "Booking"("channel", "externalBookingId");
