-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "propertyId" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_propertyId_idx" ON "AuditLog"("propertyId");
