-- CreateTable
CREATE TABLE "GuestCheckInLink" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestCheckInLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuestCheckInLink_bookingId_key" ON "GuestCheckInLink"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestCheckInLink_tokenHash_key" ON "GuestCheckInLink"("tokenHash");

-- CreateIndex
CREATE INDEX "GuestCheckInLink_expiresAt_idx" ON "GuestCheckInLink"("expiresAt");

-- CreateIndex
CREATE INDEX "GuestCheckInLink_revokedAt_idx" ON "GuestCheckInLink"("revokedAt");

-- AddForeignKey
ALTER TABLE "GuestCheckInLink" ADD CONSTRAINT "GuestCheckInLink_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
