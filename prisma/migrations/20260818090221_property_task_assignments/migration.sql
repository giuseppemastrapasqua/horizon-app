-- CreateEnum
CREATE TYPE "PropertyTaskAssignmentRole" AS ENUM ('CLEANING', 'MAINTENANCE', 'OPERATIONS');

-- CreateTable
CREATE TABLE "PropertyTaskAssignment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PropertyTaskAssignmentRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyTaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyTaskAssignment_propertyId_idx" ON "PropertyTaskAssignment"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyTaskAssignment_userId_idx" ON "PropertyTaskAssignment"("userId");

-- CreateIndex
CREATE INDEX "PropertyTaskAssignment_role_idx" ON "PropertyTaskAssignment"("role");

-- CreateIndex
CREATE INDEX "PropertyTaskAssignment_active_idx" ON "PropertyTaskAssignment"("active");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyTaskAssignment_propertyId_role_key" ON "PropertyTaskAssignment"("propertyId", "role");

-- AddForeignKey
ALTER TABLE "PropertyTaskAssignment" ADD CONSTRAINT "PropertyTaskAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyTaskAssignment" ADD CONSTRAINT "PropertyTaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
