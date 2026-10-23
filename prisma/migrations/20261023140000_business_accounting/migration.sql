CREATE TABLE "BusinessAccounting" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "config" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessAccounting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessAccounting_userId_year_key" ON "BusinessAccounting"("userId", "year");
ALTER TABLE "BusinessAccounting" ADD CONSTRAINT "BusinessAccounting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
