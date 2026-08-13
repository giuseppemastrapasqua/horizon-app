-- CreateEnum
CREATE TYPE "IntegrationTransport" AS ENUM ('ICAL', 'API', 'WEBHOOK', 'FILE');

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "transport" "IntegrationTransport" NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT,
    "lastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnectionProperty" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "externalPropertyId" TEXT,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationConnectionProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntegrationConnection_ownerId_idx" ON "IntegrationConnection"("ownerId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_connectorKey_idx" ON "IntegrationConnection"("connectorKey");

-- CreateIndex
CREATE INDEX "IntegrationConnection_transport_idx" ON "IntegrationConnection"("transport");

-- CreateIndex
CREATE INDEX "IntegrationConnection_enabled_idx" ON "IntegrationConnection"("enabled");

-- CreateIndex
CREATE INDEX "IntegrationConnectionProperty_propertyId_idx" ON "IntegrationConnectionProperty"("propertyId");

-- CreateIndex
CREATE INDEX "IntegrationConnectionProperty_externalPropertyId_idx" ON "IntegrationConnectionProperty"("externalPropertyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnectionProperty_connectionId_propertyId_key" ON "IntegrationConnectionProperty"("connectionId", "propertyId");

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnectionProperty" ADD CONSTRAINT "IntegrationConnectionProperty_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnectionProperty" ADD CONSTRAINT "IntegrationConnectionProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
