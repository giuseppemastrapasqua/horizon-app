-- CreateTable
CREATE TABLE "SoggiorniamoAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "municipalityCode" TEXT NOT NULL DEFAULT 'F205',
    "userCode" TEXT NOT NULL,
    "authCodeEncrypted" TEXT NOT NULL,
    "managerTaxCode" TEXT NOT NULL,
    "managerFirstName" TEXT NOT NULL,
    "managerLastName" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoggiorniamoAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoggiorniamoProperty" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "structureName" TEXT NOT NULL,
    "unitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SoggiorniamoProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SoggiorniamoAccount_ownerId_idx" ON "SoggiorniamoAccount"("ownerId");

-- CreateIndex
CREATE INDEX "SoggiorniamoAccount_userCode_idx" ON "SoggiorniamoAccount"("userCode");

-- CreateIndex
CREATE UNIQUE INDEX "SoggiorniamoProperty_propertyId_key" ON "SoggiorniamoProperty"("propertyId");

-- CreateIndex
CREATE INDEX "SoggiorniamoProperty_accountId_idx" ON "SoggiorniamoProperty"("accountId");

-- CreateIndex
CREATE INDEX "SoggiorniamoProperty_propertyId_idx" ON "SoggiorniamoProperty"("propertyId");

-- CreateIndex
CREATE INDEX "SoggiorniamoProperty_structureId_idx" ON "SoggiorniamoProperty"("structureId");

-- CreateIndex
CREATE UNIQUE INDEX "SoggiorniamoProperty_accountId_structureId_key" ON "SoggiorniamoProperty"("accountId", "structureId");

-- AddForeignKey
ALTER TABLE "SoggiorniamoAccount" ADD CONSTRAINT "SoggiorniamoAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoggiorniamoProperty" ADD CONSTRAINT "SoggiorniamoProperty_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SoggiorniamoAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoggiorniamoProperty" ADD CONSTRAINT "SoggiorniamoProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
