ALTER TABLE "PropertyCheckInConfiguration"
ADD COLUMN "checkInTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "PropertyCheckInConfiguration"
SET "checkInTypes" = ARRAY["checkInType"]
WHERE "checkInType" IS NOT NULL
  AND BTRIM("checkInType") <> '';

ALTER TABLE "PropertyCheckInConfiguration"
DROP COLUMN "checkInType";
