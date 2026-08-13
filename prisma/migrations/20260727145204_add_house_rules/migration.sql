-- CreateTable
CREATE TABLE "HouseRule" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HouseRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyHouseRule" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "houseRuleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyHouseRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseRule_key_key" ON "HouseRule"("key");

-- CreateIndex
CREATE INDEX "HouseRule_category_idx" ON "HouseRule"("category");

-- CreateIndex
CREATE INDEX "HouseRule_isActive_idx" ON "HouseRule"("isActive");

-- CreateIndex
CREATE INDEX "HouseRule_category_sortOrder_idx" ON "HouseRule"("category", "sortOrder");

-- CreateIndex
CREATE INDEX "PropertyHouseRule_propertyId_idx" ON "PropertyHouseRule"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyHouseRule_houseRuleId_idx" ON "PropertyHouseRule"("houseRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyHouseRule_propertyId_houseRuleId_key" ON "PropertyHouseRule"("propertyId", "houseRuleId");

-- AddForeignKey
ALTER TABLE "PropertyHouseRule" ADD CONSTRAINT "PropertyHouseRule_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyHouseRule" ADD CONSTRAINT "PropertyHouseRule_houseRuleId_fkey" FOREIGN KEY ("houseRuleId") REFERENCES "HouseRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
