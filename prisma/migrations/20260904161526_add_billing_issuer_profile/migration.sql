-- CreateTable
CREATE TABLE "BillingIssuerProfile" (
    "id" TEXT NOT NULL,
    "profileKey" TEXT NOT NULL DEFAULT 'DEFAULT',
    "businessName" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "taxCode" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IT',
    "email" TEXT NOT NULL,
    "pec" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingIssuerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingIssuerProfile_profileKey_key" ON "BillingIssuerProfile"("profileKey");
