/*
  Warnings:

  - A unique constraint covering the columns `[cin]` on the table `Property` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cir]` on the table `Property` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Property_cin_key" ON "Property"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Property_cir_key" ON "Property"("cir");
