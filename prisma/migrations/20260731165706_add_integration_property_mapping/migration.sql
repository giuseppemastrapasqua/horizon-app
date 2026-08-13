-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('BOOKING_COM', 'AIRBNB', 'VRBO', 'ALLOGGIATI_WEB', 'ISTAT', 'SOGGIORNIAMO', 'STRIPE');

-- CreateTable
CREATE TABLE "IntegrationPropertyMapping" (
    "id" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "externalPropertyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationPropertyMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationPropertyMapping_propertyId_idx" ON "IntegrationPropertyMapping"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationPropertyMapping_provider_externalPropertyId_key" ON "IntegrationPropertyMapping"("provider", "externalPropertyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationPropertyMapping_provider_propertyId_key" ON "IntegrationPropertyMapping"("provider", "propertyId");

-- AddForeignKey
ALTER TABLE "IntegrationPropertyMapping" ADD CONSTRAINT "IntegrationPropertyMapping_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
