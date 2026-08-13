-- CreateTable
CREATE TABLE "PropertyCodeVerification" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "cin" TEXT NOT NULL,
    "cir" TEXT NOT NULL,
    "status" "PropertyCodeVerificationStatus" NOT NULL,
    "notes" TEXT,
    "rawResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyCodeVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyCodeVerification_propertyId_idx" ON "PropertyCodeVerification"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyCodeVerification_status_idx" ON "PropertyCodeVerification"("status");

-- CreateIndex
CREATE INDEX "PropertyCodeVerification_createdAt_idx" ON "PropertyCodeVerification"("createdAt");

-- AddForeignKey
ALTER TABLE "PropertyCodeVerification" ADD CONSTRAINT "PropertyCodeVerification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
