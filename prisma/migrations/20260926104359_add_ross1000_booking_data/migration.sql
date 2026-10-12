-- CreateTable
CREATE TABLE "Ross1000BookingData" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "tourismType" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ross1000BookingData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ross1000BookingData_bookingId_key" ON "Ross1000BookingData"("bookingId");

-- CreateIndex
CREATE INDEX "Ross1000BookingData_bookingId_idx" ON "Ross1000BookingData"("bookingId");

-- AddForeignKey
ALTER TABLE "Ross1000BookingData" ADD CONSTRAINT "Ross1000BookingData_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
