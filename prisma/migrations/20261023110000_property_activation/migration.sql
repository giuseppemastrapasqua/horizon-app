CREATE TABLE "PropertyActivation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PropertyActivation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyActivation_propertyId_key" ON "PropertyActivation"("propertyId");
ALTER TABLE "PropertyActivation" ADD CONSTRAINT "PropertyActivation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
