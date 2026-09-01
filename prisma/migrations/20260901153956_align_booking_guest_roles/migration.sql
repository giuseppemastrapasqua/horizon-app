/*
  Warnings:

  - The values [LEADER,MEMBER] on the enum `BookingGuestRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BookingGuestRole_new" AS ENUM ('SINGLE_GUEST', 'FAMILY_HEAD', 'GROUP_HEAD', 'FAMILY_MEMBER', 'GROUP_MEMBER');
ALTER TABLE "public"."BookingGuest" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "BookingGuest" ALTER COLUMN "role" TYPE "BookingGuestRole_new" USING ("role"::text::"BookingGuestRole_new");
ALTER TYPE "BookingGuestRole" RENAME TO "BookingGuestRole_old";
ALTER TYPE "BookingGuestRole_new" RENAME TO "BookingGuestRole";
DROP TYPE "public"."BookingGuestRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "BookingGuest" ALTER COLUMN "role" DROP DEFAULT;
