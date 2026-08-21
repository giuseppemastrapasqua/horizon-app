-- CreateTable
CREATE TABLE "PropertyChannelCommission" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "channel" "BookingChannel" NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyChannelCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyChannelCommission_propertyId_idx" ON "PropertyChannelCommission"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyChannelCommission_channel_idx" ON "PropertyChannelCommission"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyChannelCommission_propertyId_channel_key" ON "PropertyChannelCommission"("propertyId", "channel");

-- AddForeignKey
ALTER TABLE "PropertyChannelCommission" ADD CONSTRAINT "PropertyChannelCommission_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
