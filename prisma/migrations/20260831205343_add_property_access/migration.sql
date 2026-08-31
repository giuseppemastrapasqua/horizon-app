-- CreateEnum
CREATE TYPE "PropertyAccessRole" AS ENUM ('OWNER', 'MANAGER', 'FINANCE', 'VIEWER');

-- CreateTable
CREATE TABLE "PropertyAccess" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PropertyAccessRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyAccess_propertyId_idx" ON "PropertyAccess"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyAccess_userId_idx" ON "PropertyAccess"("userId");

-- CreateIndex
CREATE INDEX "PropertyAccess_role_idx" ON "PropertyAccess"("role");

-- CreateIndex
CREATE INDEX "PropertyAccess_active_idx" ON "PropertyAccess"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAccess_propertyId_userId_key" ON "PropertyAccess"("propertyId", "userId");

-- AddForeignKey
ALTER TABLE "PropertyAccess" ADD CONSTRAINT "PropertyAccess_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAccess" ADD CONSTRAINT "PropertyAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
