-- DropIndex
DROP INDEX "Booking_channel_externalBookingId_key";

-- CreateIndex
CREATE INDEX "Booking_channel_externalBookingId_idx" ON "Booking"("channel", "externalBookingId");
