-- CreateTable
CREATE TABLE "AlloggiatiWebReceipt" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "storageKey" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "encryptionVersion" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlloggiatiWebReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlloggiatiWebReceipt_propertyId_idx" ON "AlloggiatiWebReceipt"("propertyId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebReceipt_accountId_idx" ON "AlloggiatiWebReceipt"("accountId");

-- CreateIndex
CREATE INDEX "AlloggiatiWebReceipt_receiptDate_idx" ON "AlloggiatiWebReceipt"("receiptDate");

-- CreateIndex
CREATE UNIQUE INDEX "AlloggiatiWebReceipt_accountId_propertyId_receiptDate_key" ON "AlloggiatiWebReceipt"("accountId", "propertyId", "receiptDate");

-- AddForeignKey
ALTER TABLE "AlloggiatiWebReceipt" ADD CONSTRAINT "AlloggiatiWebReceipt_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlloggiatiWebReceipt" ADD CONSTRAINT "AlloggiatiWebReceipt_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "AlloggiatiWebAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
