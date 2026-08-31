-- CreateTable
CREATE TABLE "PropertyOwnerInvite" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOwnerInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOwnerInvite_tokenHash_key" ON "PropertyOwnerInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "PropertyOwnerInvite_propertyId_idx" ON "PropertyOwnerInvite"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyOwnerInvite_email_idx" ON "PropertyOwnerInvite"("email");

-- CreateIndex
CREATE INDEX "PropertyOwnerInvite_expiresAt_idx" ON "PropertyOwnerInvite"("expiresAt");

-- AddForeignKey
ALTER TABLE "PropertyOwnerInvite" ADD CONSTRAINT "PropertyOwnerInvite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
