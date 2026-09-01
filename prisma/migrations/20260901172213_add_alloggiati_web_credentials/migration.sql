-- CreateTable
CREATE TABLE "AlloggiatiWebCredential" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "usernameEncrypted" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "wsKeyEncrypted" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlloggiatiWebCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebCredential_propertyId_key" ON "AlloggiatiWebCredential"("propertyId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebCredential_propertyId_idx" ON "AlloggiatiWebCredential"("propertyId");

-- AddForeignKey
ALTER TABLE "AlloggiatiWebCredential" ADD CONSTRAINT "AlloggiatiWebCredential_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
