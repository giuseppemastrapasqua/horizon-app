-- CreateEnum
CREATE TYPE "SystemEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SystemEventSource" AS ENUM ('HORIZON', 'BOOKING_COM', 'AIRBNB', 'VRBO', 'STRIPE', 'ALLOGGIATI_WEB', 'ISTAT', 'EMAIL', 'WHATSAPP', 'API', 'MANUAL');

-- CreateIndex
CREATE INDEX "Booking_externalBookingId_idx" ON "Booking"("externalBookingId");

-- CreateIndex
CREATE INDEX "Document_updatedAt_idx" ON "Document"("updatedAt");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
