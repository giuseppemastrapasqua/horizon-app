import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  propertyFindUnique: vi.fn(),
  ensureGuestIdswh: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: mocks.propertyFindUnique,
    },
  },
}));

vi.mock("./prisma-guest-idswh", () => ({
  ensureRoss1000GuestIdswh: mocks.ensureGuestIdswh,
}));

import type {
  AlloggiatiReferenceResolver,
} from "../alloggiati-web/reference-resolver";
import {
  loadRoss1000MovementsFromPrisma,
} from "./prisma-movement-loader";

function createResolver(): AlloggiatiReferenceResolver {
  return {
    resolveCountryCode: vi.fn(async (country: string) =>
      country === "Italia" ? "100000100" : null,
    ),
    isItaly: vi.fn(async (country: string) =>
      country === "Italia",
    ),
    resolveMunicipalityCode: vi.fn(
      async (city: string, province?: string | null) =>
        city === "Milano" && province === "MI"
          ? "015146"
          : null,
    ),
    resolveDocumentTypeCode: vi.fn(async () => null),
  };
}

function createPropertyResult() {
  return {
    id: "property-1",
    ross1000Property: {
      structureCode: "A00000",
      roomsAvailable: 2,
      bedsAvailable: 4,
    },    availabilityBlocks: [],
    bookings: [
      {
        id: "booking-1",
        checkIn: new Date("2026-09-29T00:00:00.000Z"),
        checkOut: new Date("2026-10-01T00:00:00.000Z"),
        guests: 2,
        ross1000BookingData: {
          tourismType: "Culturale",
          transportType: "Auto",
          roomsOccupied: 1,
        },
        bookingGuests: [
          {
            id: "guest-1",
            ross1000Idswh: "H1111111111111111111",
            role: "FAMILY_HEAD",
            firstName: "Mario",
            lastName: "Rossi",
            gender: "MALE",
            birthDate: new Date("1980-01-02T00:00:00.000Z"),
            birthCity: "Milano",
            birthProvince: "MI",
            birthCountry: "Italia",
            citizenship: "Italia",
            residenceCountry: "Italia",
            residenceCity: "Milano",
            residenceProvince: "MI",
          },
          {
            id: "guest-2",
            ross1000Idswh: null,
            role: "FAMILY_MEMBER",
            firstName: "Anna",
            lastName: "Rossi",
            gender: "FEMALE",
            birthDate: new Date("1982-03-04T00:00:00.000Z"),
            birthCity: "Milano",
            birthProvince: "MI",
            birthCountry: "Italia",
            citizenship: "Italia",
            residenceCountry: "Italia",
            residenceCity: "Milano",
            residenceProvince: "MI",
          },
        ],
      },
    ],
  };
}

describe("loadRoss1000MovementsFromPrisma", () => {
  beforeEach(() => {
    mocks.propertyFindUnique.mockReset();
    mocks.ensureGuestIdswh.mockReset();
  });

  it("loads the stay and generates the daily movement", async () => {
    mocks.propertyFindUnique.mockResolvedValue(
      createPropertyResult(),
    );
    mocks.ensureGuestIdswh.mockResolvedValue(
      "H2222222222222222222",
    );

    const result = await loadRoss1000MovementsFromPrisma(
      "property-1",
      new Date("2026-09-29T14:30:00.000Z"),
      createResolver(),
    );

    expect(mocks.propertyFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "property-1",
        },
        select: expect.objectContaining({
          bookings: expect.objectContaining({
            where: {
              bookingStatus: {
                not: "CANCELLED",
              },
              checkIn: {
                lt: new Date("2026-09-30T00:00:00.000Z"),
              },
              checkOut: {
                gt: new Date("2026-09-29T00:00:00.000Z"),
              },
            },
          }),
        }),
      }),
    );

    expect(mocks.ensureGuestIdswh).toHaveBeenCalledTimes(1);
    expect(mocks.ensureGuestIdswh).toHaveBeenCalledWith(
      "guest-2",
    );

    expect(result.codice).toBe("A00000");
    expect(result.prodotto).toBe("Horizon");
    expect(result.movimenti[0].data).toBe("20260929");
    expect(result.movimenti[0].struttura).toEqual({
      apertura: "SI",
      camereOccupate: 1,
      camereDisponibili: 2,
      lettiDisponibili: 4,
    });

    expect(result.movimenti[0].arrivi).toHaveLength(2);
    expect(result.movimenti[0].arrivi?.[1]).toMatchObject({
      idswh: "H2222222222222222222",
      tipoAlloggiato: "19",
      idCapo: "H1111111111111111111",
    });
  });

  it("rejects a property without ROSS1000 configuration", async () => {
    const property = createPropertyResult();
    mocks.propertyFindUnique.mockResolvedValue({
      ...property,
      ross1000Property: null,
    });

    await expect(
      loadRoss1000MovementsFromPrisma(
        "property-1",
        new Date("2026-09-29T00:00:00.000Z"),
        createResolver(),
      ),
    ).rejects.toThrow(
      "ROSS1000: configurazione struttura mancante per property-1.",
    );
  });

  it("rejects a booking without ROSS1000 stay data", async () => {
    const property = createPropertyResult();
    mocks.propertyFindUnique.mockResolvedValue({
      ...property,
      bookings: [
        {
          ...property.bookings[0],
          ross1000BookingData: null,
        },
      ],
    });

    await expect(
      loadRoss1000MovementsFromPrisma(
        "property-1",
        new Date("2026-09-29T00:00:00.000Z"),
        createResolver(),
      ),
    ).rejects.toThrow(
      "ROSS1000: dati soggiorno mancanti per il booking booking-1.",
    );
  });

  it("generates a closed day from a MANUAL availability block", async () => {
    const property = createPropertyResult();

    mocks.propertyFindUnique.mockResolvedValue({
      ...property,
      availabilityBlocks: [
        {
          id: "block-1",
        },
      ],
      bookings: [],
    });

    const result = await loadRoss1000MovementsFromPrisma(
      "property-1",
      new Date("2026-09-29T14:30:00.000Z"),
      createResolver(),
    );

    expect(mocks.propertyFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          availabilityBlocks: {
            where: {
              source: "MANUAL",
              startDate: {
                lt: new Date("2026-09-30T00:00:00.000Z"),
              },
              endDate: {
                gte: new Date("2026-09-29T00:00:00.000Z"),
              },
            },
            select: {
              id: true,
            },
            take: 1,
          },
        }),
      }),
    );

    expect(result.movimenti[0].struttura).toEqual({
      apertura: "NO",
      camereOccupate: 0,
      camereDisponibili: 0,
      lettiDisponibili: 0,
    });

    expect(result.movimenti[0].arrivi).toBeUndefined();
    expect(result.movimenti[0].partenze).toBeUndefined();
  });
});
