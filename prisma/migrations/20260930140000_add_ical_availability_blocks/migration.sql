-- AlterTable
ALTER TABLE "PropertyAvailabilityBlock" ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "integrationConnectionPropertyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "availability_block_integration_event_key" ON "PropertyAvailabilityBlock"("integrationConnectionPropertyId", "externalEventId");

-- AddForeignKey
ALTER TABLE "PropertyAvailabilityBlock" ADD CONSTRAINT "PropertyAvailabilityBlock_integrationConnectionPropertyId_fkey" FOREIGN KEY ("integrationConnectionPropertyId") REFERENCES "IntegrationConnectionProperty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

