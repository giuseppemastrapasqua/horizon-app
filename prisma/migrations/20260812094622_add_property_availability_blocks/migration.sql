-- CreateEnum
CREATE TYPE "AvailabilityBlockSource" AS ENUM ('MANUAL', 'AI', 'OWNER', 'INTEGRATION');

-- CreateTable
CREATE TABLE "PropertyAvailabilityBlock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "source" "AvailabilityBlockSource" NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyAvailabilityBlock_propertyId_idx" ON "PropertyAvailabilityBlock"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAvailabilityBlock_propertyId_startDate_endDate_idx" ON "PropertyAvailabilityBlock"("propertyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "PropertyAvailabilityBlock_source_idx" ON "PropertyAvailabilityBlock"("source");

-- CreateIndex
CREATE INDEX "PropertyAvailabilityBlock_createdById_idx" ON "PropertyAvailabilityBlock"("createdById");

-- AddForeignKey
ALTER TABLE "PropertyAvailabilityBlock" ADD CONSTRAINT "PropertyAvailabilityBlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAvailabilityBlock" ADD CONSTRAINT "PropertyAvailabilityBlock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
