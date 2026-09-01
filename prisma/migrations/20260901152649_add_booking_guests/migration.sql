-- CreateEnum
CREATE TYPE "BookingGuestRole" AS ENUM ('LEADER', 'MEMBER');

-- CreateEnum
CREATE TYPE "BookingGuestGender" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "BookingGuest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "role" "BookingGuestRole" NOT NULL DEFAULT 'MEMBER',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" "BookingGuestGender" NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthCity" TEXT,
    "birthProvince" TEXT,
    "birthCountry" TEXT NOT NULL,
    "citizenship" TEXT NOT NULL,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "documentIssueCountry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BookingGuest_bookingId_idx" ON "BookingGuest"("bookingId");

-- CreateIndex
CREATE INDEX "BookingGuest_lastName_firstName_idx" ON "BookingGuest"("lastName", "firstName");

-- AddForeignKey
ALTER TABLE "BookingGuest" ADD CONSTRAINT "BookingGuest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
