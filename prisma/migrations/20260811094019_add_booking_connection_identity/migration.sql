/*
  Warnings:

  - A unique constraint covering the columns `[integrationConnectionId,externalBookingId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Booking_integrationConnectionId_idx" ON "Booking"("integrationConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_integrationConnectionId_externalBookingId_key" ON "Booking"("integrationConnectionId", "externalBookingId");
