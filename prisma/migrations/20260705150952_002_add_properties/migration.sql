-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'MAINTENANCE', 'OFFLINE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PropertyCommercialClass" AS ENUM ('PREMIUM_PERFORMER', 'SOLID_PERFORMER', 'VOLUME_PERFORMER', 'RECOVERY_REPOSITIONING');

-- CreateEnum
CREATE TYPE "PropertyVictoryModel" AS ENUM ('ADR_WINNER', 'OCCUPANCY_WINNER', 'BALANCED_WINNER', 'RECOVERY_WINNER');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Milano',
    "zone" TEXT,
    "maxGuests" INTEGER NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "status" "PropertyStatus" NOT NULL DEFAULT 'DRAFT',
    "commercialClass" "PropertyCommercialClass" NOT NULL DEFAULT 'SOLID_PERFORMER',
    "victoryModel" "PropertyVictoryModel" NOT NULL DEFAULT 'BALANCED_WINNER',
    "initialScore" INTEGER NOT NULL DEFAULT 70,
    "currentScore" INTEGER NOT NULL DEFAULT 70,
    "monthlyTarget" INTEGER,
    "stretchTarget" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);
