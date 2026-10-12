import { BookingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { AlloggiatiReferenceResolver } from "../alloggiati-web/reference-resolver";
import { ensureRoss1000GuestIdswh } from "./prisma-guest-idswh";
import {
  generateRoss1000Movements,
} from "./movement-generator";
import type {
  Ross1000MovementGeneratorInput,
} from "./movement-generator-types";
import type {
  Ross1000Movements,
} from "./movement-types";

const ROSS1000_PRODUCT = "Horizon";

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function nextUtcDay(date: Date): Date {
  const start = startOfUtcDay(date);

  return new Date(
    Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + 1,
    ),
  );
}

export async function loadRoss1000MovementsFromPrisma(
  propertyId: string,
  movementDate: Date,
  resolver: AlloggiatiReferenceResolver,
): Promise<Ross1000Movements> {
  const dayStart = startOfUtcDay(movementDate);
  const dayEnd = nextUtcDay(movementDate);

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      ross1000Property: {
        select: {
          structureCode: true,
          roomsAvailable: true,
          bedsAvailable: true,
        },
      },      availabilityBlocks: {
        where: {
          source: "MANUAL",
          startDate: {
            lt: dayEnd,
          },
          endDate: {
            gte: dayStart,
          },
        },
        select: {
          id: true,
        },
        take: 1,
      },
      bookings: {
        where: {
          bookingStatus: {
            not: BookingStatus.CANCELLED,
          },
          checkIn: {
            lt: dayEnd,
          },
          checkOut: {
            gt: dayStart,
          },
        },
        orderBy: [
          {
            checkIn: "asc",
          },
          {
            id: "asc",
          },
        ],
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          ross1000BookingData: {
            select: {
              tourismType: true,
              transportType: true,
              roomsOccupied: true,
            },
          },
          bookingGuests: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              role: true,
              firstName: true,
              lastName: true,
              gender: true,
              birthDate: true,
              birthCity: true,
              birthProvince: true,
              birthCountry: true,
              citizenship: true,
              residenceCountry: true,
              residenceCity: true,
              residenceProvince: true,
              ross1000Idswh: true,
            },
          },
        },
      },
    },
  });

  if (!property) {
    throw new Error(
      `ROSS1000: struttura Horizon non trovata: ${propertyId}.`,
    );
  }

  if (!property.ross1000Property) {
    throw new Error(
      `ROSS1000: configurazione struttura mancante per ${propertyId}.`,
    );
  }

  const bookings: Ross1000MovementGeneratorInput["bookings"] =
    [];

  for (const booking of property.bookings) {
    if (!booking.ross1000BookingData) {
      throw new Error(
        `ROSS1000: dati soggiorno mancanti per il booking ${booking.id}.`,
      );
    }

    const bookingGuests = [];

    for (const guest of booking.bookingGuests) {
      const ross1000Idswh =
        guest.ross1000Idswh ??
        (await ensureRoss1000GuestIdswh(guest.id));

      bookingGuests.push({
        id: guest.id,
        ross1000Idswh,
        role: guest.role,
        firstName: guest.firstName,
        lastName: guest.lastName,
        gender: guest.gender,
        birthDate: guest.birthDate,
        birthCity: guest.birthCity,
        birthProvince: guest.birthProvince,
        birthCountry: guest.birthCountry,
        citizenship: guest.citizenship,
        residenceCountry: guest.residenceCountry,
        residenceCity: guest.residenceCity,
        residenceProvince: guest.residenceProvince,
      });
    }

    bookings.push({
      id: booking.id,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      tourismType:
        booking.ross1000BookingData.tourismType,
      transportType:
        booking.ross1000BookingData.transportType,
      roomsOccupied:
        booking.ross1000BookingData.roomsOccupied,
      bookingGuests,
    });
  }

  return generateRoss1000Movements(
    {
      product: ROSS1000_PRODUCT,
      movementDate: dayStart,
      property: {
        structureCode:
          property.ross1000Property.structureCode,
        roomsAvailable:
          property.ross1000Property.roomsAvailable,
        bedsAvailable:
          property.ross1000Property.bedsAvailable,        isOpen:
          property.availabilityBlocks.length === 0,
      },
      bookings,
    },
    resolver,
  );
}
