-- CreateEnum
CREATE TYPE "PropertyDocumentType" AS ENUM ('CIN', 'CIR', 'SCIA', 'ENERGY_CERTIFICATE', 'INSURANCE', 'IDENTITY_DOCUMENT', 'FLOOR_PLAN', 'CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyDocumentValidity" AS ENUM ('VALID', 'EXPIRING', 'EXPIRED');

-- CreateTable
CREATE TABLE "PropertyDocument" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "PropertyDocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "documentNumber" TEXT,
    "issuer" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "validity" "PropertyDocumentValidity" NOT NULL DEFAULT 'VALID',
    "fileUrl" TEXT,
    "filename" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyDocument_propertyId_idx" ON "PropertyDocument"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyDocument_type_idx" ON "PropertyDocument"("type");

-- CreateIndex
CREATE INDEX "PropertyDocument_validity_idx" ON "PropertyDocument"("validity");

-- CreateIndex
CREATE INDEX "PropertyDocument_expiryDate_idx" ON "PropertyDocument"("expiryDate");

-- AddForeignKey
ALTER TABLE "PropertyDocument" ADD CONSTRAINT "PropertyDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
