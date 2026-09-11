-- CreateTable
CREATE TABLE "PropertyOperatorInvite" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOperatorInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOperatorInvite_tokenHash_key" ON "PropertyOperatorInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "PropertyOperatorInvite_propertyId_idx" ON "PropertyOperatorInvite"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyOperatorInvite_email_idx" ON "PropertyOperatorInvite"("email");

-- CreateIndex
CREATE INDEX "PropertyOperatorInvite_expiresAt_idx" ON "PropertyOperatorInvite"("expiresAt");

-- AddForeignKey
ALTER TABLE "PropertyOperatorInvite" ADD CONSTRAINT "PropertyOperatorInvite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
