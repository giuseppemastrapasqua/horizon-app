-- CreateTable
CREATE TABLE "PropertyCheckInConfiguration" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "checkInType" TEXT,
    "arrivalInstructions" TEXT,
    "accessInstructions" TEXT,
    "buildingAccessCode" TEXT,
    "apartmentAccessCode" TEXT,
    "wifiName" TEXT,
    "wifiPassword" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "parkingInstructions" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyCheckInConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyCheckInConfiguration_propertyId_key" ON "PropertyCheckInConfiguration"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyCheckInConfiguration_propertyId_idx" ON "PropertyCheckInConfiguration"("propertyId");

-- AddForeignKey
ALTER TABLE "PropertyCheckInConfiguration" ADD CONSTRAINT "PropertyCheckInConfiguration_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
