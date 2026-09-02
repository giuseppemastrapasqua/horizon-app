/*
  Warnings:

  - You are about to drop the `AlloggiatiWebCredential` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AlloggiatiWebCredential" DROP CONSTRAINT "AlloggiatiWebCredential_propertyId_fkey";

-- DropTable
DROP TABLE "AlloggiatiWebCredential";

-- CreateTable
CREATE TABLE "AlloggiatiWebAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usernameEncrypted" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "wsKeyEncrypted" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlloggiatiWebAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlloggiatiWebProperty" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlloggiatiWebProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlloggiatiWebAccount_ownerId_idx" ON "AlloggiatiWebAccount"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebProperty_propertyId_key" ON "AlloggiatiWebProperty"("propertyId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebProperty_accountId_idx" ON "AlloggiatiWebProperty"("accountId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebProperty_propertyId_idx" ON "AlloggiatiWebProperty"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebProperty_accountId_apartmentId_key" ON "AlloggiatiWebProperty"("accountId", "apartmentId");

-- AddForeignKey
ALTER TABLE "AlloggiatiWebAccount" ADD CONSTRAINT "AlloggiatiWebAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlloggiatiWebProperty" ADD CONSTRAINT "AlloggiatiWebProperty_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AlloggiatiWebAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlloggiatiWebProperty" ADD CONSTRAINT "AlloggiatiWebProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
