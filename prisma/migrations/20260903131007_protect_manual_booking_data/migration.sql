-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "guestDataManuallyEdited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricingDataManuallyEdited" BOOLEAN NOT NULL DEFAULT false;
