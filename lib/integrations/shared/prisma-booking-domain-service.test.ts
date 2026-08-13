import {
  BookingChannel,
  BookingOperationalStatus,
  BookingStatus,
  type Prisma,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type { BookingUpsertInput } from "./booking-upsert-input";
import type { ExternalPropertyResolver } from "./external-property-resolver";

const bookingFindUniqueMock = vi.hoisted(() =>
  vi.fn(),
);

const bookingFindFirstMock = vi.hoisted(() =>
  vi.fn(),
);

const bookingCreateMock = vi.hoisted(() =>
  vi.fn(),
);

const bookingUpdateMock = vi.hoisted(() =>
  vi.fn(),
);

const findOrCreateGuestMock = vi.hoisted(() =>
  vi.fn(),
);

const auditLogMock = vi.hoisted(() =>
  vi.fn(),
);

const emitEventMock = vi.hoisted(() =>
  vi.fn(),
);

const transactionClient = vi.hoisted(() => ({
  booking: {
    findUnique: bookingFindUniqueMock,
    findFirst: bookingFindFirstMock,
    create: bookingCreateMock,
    update: bookingUpdateMock,
  },
}));

const prismaTransactionMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: prismaTransactionMock,
  },
}));

vi.mock(
  "@/lib/guests/find-or-create-guest",
  () => ({
    findOrCreateGuest:
      findOrCreateGuestMock,
  }),
);

vi.mock("@/lib/events/emit", () => ({
  emitEvent: emitEventMock,
}));

vi.mock(
  "@/services/audit/AuditService",
  () => ({
    AuditService: {
      log: auditLogMock,
    },
  }),
);

import { PrismaBookingDomainService } from "./prisma-booking-domain-service";

describe("PrismaBookingDomainService", () => {
  beforeEach(() => {
    bookingFindUniqueMock.mockReset();
    bookingFindFirstMock.mockReset();

    bookingCreateMock.mockReset();
    bookingUpdateMock.mockReset();

    findOrCreateGuestMock.mockReset();
    auditLogMock.mockReset();
    emitEventMock.mockReset();
    prismaTransactionMock.mockReset();

    prismaTransactionMock.mockImplementation(
      async (
        callback: (
          transaction: Prisma.TransactionClient,
        ) => Promise<unknown>,
      ) =>
        callback(
          transactionClient as unknown as Prisma.TransactionClient,
        ),
    );

    findOrCreateGuestMock.mockResolvedValue({
      guest: {
        id: "guest-1",
      },
      created: true,
    });

    auditLogMock.mockResolvedValue(
      undefined,
    );

    emitEventMock.mockResolvedValue({
      id: "event-1",
      created: true,
    });
  });

  it("crea booking, audit ed evento BOOKING_CREATED quando la prenotazione non esiste", async () => {
    const propertyResolver =
      createPropertyResolver();

    bookingFindFirstMock.mockResolvedValueOnce(
      null,
    );

    bookingCreateMock.mockResolvedValueOnce({
      id: "booking-1",

      integrationConnectionId:
        null,

      propertyId:
        "property-1",

      ownerId:
        "owner-1",

      guestId:
        "guest-1",

      channel:
        BookingChannel.BOOKING,

      externalBookingId:
        "booking-ext-1",

      guestName:
        "Mario Rossi",

      guestEmail:
        "mario@example.com",

      guestPhone:
        "+39 333 1234567",

      checkIn: new Date(
        "2026-09-10T14:00:00.000Z",
      ),

      checkOut: new Date(
        "2026-09-13T10:00:00.000Z",
      ),

      nights: 3,
      guests: 2,

      grossAmount: 450,
      currency: "EUR",

      bookingStatus:
        BookingStatus.CONFIRMED,

      operationalStatus:
        BookingOperationalStatus.OK,
    });

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    const result =
      await service.upsertBooking(
        createBookingInput(),
      );

    expect(result).toEqual({
      inserted: 1,
      updated: 0,
      skipped: 0,
    });

    expect(
      propertyResolver.resolveProperty,
    ).toHaveBeenCalledWith({
      provider:
        "BOOKING_COM",

      externalPropertyId:
        "booking-property-1",

      integrationConnectionId:
        undefined,
    });

    expect(
      bookingFindFirstMock,
    ).toHaveBeenCalledWith({
      where: {
        integrationConnectionId:
          null,

        channel:
          BookingChannel.BOOKING,

        externalBookingId:
          "booking-ext-1",
      },

      select: {
        id: true,

        integrationConnectionId:
          true,

        propertyId: true,
        ownerId: true,

        guestId: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,

        checkIn: true,
        checkOut: true,

        nights: true,
        guests: true,

        grossAmount: true,
        currency: true,

        bookingStatus: true,
        operationalStatus: true,
      },
    });

    expect(
      bookingFindUniqueMock,
    ).not.toHaveBeenCalled();

    expect(
      findOrCreateGuestMock,
    ).toHaveBeenCalledWith(
      {
        fullName:
          "Mario Rossi",

        email:
          "mario@example.com",

        phone:
          "+39 333 1234567",
      },
      transactionClient,
    );

    expect(
      bookingCreateMock,
    ).toHaveBeenCalledWith({
      data: {
        propertyId:
          "property-1",

        ownerId:
          "owner-1",

        guestId:
          "guest-1",

        channel:
          BookingChannel.BOOKING,

        externalBookingId:
          "booking-ext-1",

        integrationConnectionId:
          null,

        guestName:
          "Mario Rossi",

        guestEmail:
          "mario@example.com",

        guestPhone:
          "+39 333 1234567",

        checkIn: new Date(
          "2026-09-10T14:00:00.000Z",
        ),

        checkOut: new Date(
          "2026-09-13T10:00:00.000Z",
        ),

        nights: 3,

        guests: 2,

        grossAmount:
          450,

        currency:
          "EUR",

        bookingStatus:
          BookingStatus.CONFIRMED,

        operationalStatus:
          BookingOperationalStatus.OK,
      },
    });

    expect(
      auditLogMock,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        action:
          "CREATE",

        propertyId:
          "property-1",

        entityType:
          "BOOKING",

        entityId:
          "booking-1",

        description:
          "Prenotazione sincronizzata creata.",

        metadata:
          expect.objectContaining({
            provider:
              "BOOKING_COM",

            integrationConnectionId:
              null,

            externalBookingId:
              "booking-ext-1",

            externalPropertyId:
              "booking-property-1",

            channel:
              BookingChannel.BOOKING,

            bookingStatus:
              BookingStatus.CONFIRMED,
          }),
      }),
      transactionClient,
    );

    expect(
      emitEventMock,
    ).toHaveBeenCalledWith(
      {
        eventType:
          "BOOKING_CREATED",

        aggregateType:
          "BOOKING",

        aggregateId:
          "booking-1",

        payload: {
          bookingId:
            "booking-1",

          propertyId:
            "property-1",

          ownerId:
            "owner-1",

          guestName:
            "Mario Rossi",

          checkIn:
            "2026-09-10T14:00:00.000Z",

          checkOut:
            "2026-09-13T10:00:00.000Z",

          channel:
            BookingChannel.BOOKING,

          provider:
            "BOOKING_COM",

          integrationConnectionId:
            null,

          externalBookingId:
            "booking-ext-1",
        },

        idempotencyKey:
          "BOOKING_CREATED:booking-1",
      },
      transactionClient,
    );

    expect(
      bookingUpdateMock,
    ).not.toHaveBeenCalled();
  });

  it("aggiorna una booking modificata ed emette BOOKING_UPDATED", async () => {
    const propertyResolver =
      createPropertyResolver();

    bookingFindFirstMock.mockResolvedValueOnce({
      id:
        "booking-1",

      integrationConnectionId:
        null,

      propertyId:
        "property-1",

      ownerId:
        "owner-1",

      guestId:
        "guest-1",

      guestName:
        "Mario Rossi",

      guestEmail:
        "mario@example.com",

      guestPhone:
        "+39 333 1234567",

      checkIn:
        new Date(
          "2026-09-10T14:00:00.000Z",
        ),

      checkOut:
        new Date(
          "2026-09-13T10:00:00.000Z",
        ),

      nights:
        3,

      /*
       * Valore diverso dall'input:
       * forza l'UPDATE.
       */
      guests:
        1,

      grossAmount:
        450,

      currency:
        "EUR",

      bookingStatus:
        BookingStatus.CONFIRMED,

      operationalStatus:
        BookingOperationalStatus.OK,
    });

    findOrCreateGuestMock.mockResolvedValueOnce({
      guest: {
        id:
          "guest-1",
      },
      created:
        false,
    });

    bookingUpdateMock.mockResolvedValueOnce({
      id:
        "booking-1",
    });

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    const result =
      await service.upsertBooking(
        createBookingInput(),
      );

    expect(result).toEqual({
      inserted: 0,
      updated: 1,
      skipped: 0,
    });

    expect(
      bookingUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id:
          "booking-1",
      },

      data: {
        integrationConnectionId:
          null,

        propertyId:
          "property-1",

        ownerId:
          "owner-1",

        guestId:
          "guest-1",

        guestName:
          "Mario Rossi",

        guestEmail:
          "mario@example.com",

        guestPhone:
          "+39 333 1234567",

        checkIn:
          new Date(
            "2026-09-10T14:00:00.000Z",
          ),

        checkOut:
          new Date(
            "2026-09-13T10:00:00.000Z",
          ),

        nights:
          3,

        guests:
          2,

        grossAmount:
          450,

        currency:
          "EUR",

        bookingStatus:
          BookingStatus.CONFIRMED,
      },
    });

    expect(
      auditLogMock,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        action:
          "UPDATE",

        propertyId:
          "property-1",

        entityType:
          "BOOKING",

        entityId:
          "booking-1",

        description:
          "Prenotazione sincronizzata aggiornata.",

        metadata:
          expect.objectContaining({
            provider:
              "BOOKING_COM",

            integrationConnectionId:
              null,

            externalBookingId:
              "booking-ext-1",

            externalPropertyId:
              "booking-property-1",

            channel:
              BookingChannel.BOOKING,

            previousBookingStatus:
              BookingStatus.CONFIRMED,

            bookingStatus:
              BookingStatus.CONFIRMED,
          }),
      }),
      transactionClient,
    );

    expect(
      emitEventMock,
    ).toHaveBeenCalledWith(
      {
        eventType:
          "BOOKING_UPDATED",

        aggregateType:
          "BOOKING",

        aggregateId:
          "booking-1",

        payload: {
          bookingId:
            "booking-1",

          propertyId:
            "property-1",

          ownerId:
            "owner-1",

          guestName:
            "Mario Rossi",

          checkIn:
            "2026-09-10T14:00:00.000Z",

          checkOut:
            "2026-09-13T10:00:00.000Z",

          channel:
            BookingChannel.BOOKING,

          provider:
            "BOOKING_COM",

          integrationConnectionId:
            null,

          externalBookingId:
            "booking-ext-1",
        },

        idempotencyKey:
          "BOOKING_UPDATED:booking-1:537a82b6b02d1f4683c9b18cef3977e2758a1806214cbd5172d497bbfa0e78e9",
      },
      transactionClient,
    );

    expect(
      emitEventMock,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        eventType:
          "BOOKING_CREATED",
      }),
      expect.anything(),
    );

    expect(
      bookingCreateMock,
    ).not.toHaveBeenCalled();
  });

  it("salta una booking invariata senza audit né eventi", async () => {
    const propertyResolver =
      createPropertyResolver();

    bookingFindFirstMock.mockResolvedValueOnce(
      createExistingBooking(),
    );

    findOrCreateGuestMock.mockResolvedValueOnce({
      guest: {
        id:
          "guest-1",
      },
      created:
        false,
    });

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    const result =
      await service.upsertBooking(
        createBookingInput(),
      );

    expect(result).toEqual({
      inserted: 0,
      updated: 0,
      skipped: 1,
    });

    expect(
      bookingCreateMock,
    ).not.toHaveBeenCalled();

    expect(
      bookingUpdateMock,
    ).not.toHaveBeenCalled();

    expect(
      auditLogMock,
    ).not.toHaveBeenCalled();

    expect(
      emitEventMock,
    ).not.toHaveBeenCalled();
  });

  it("emette BOOKING_CANCELLED quando una booking passa a cancellata", async () => {
    const propertyResolver =
      createPropertyResolver();

    bookingFindFirstMock.mockResolvedValueOnce(
      createExistingBooking(),
    );

    findOrCreateGuestMock.mockResolvedValueOnce({
      guest: {
        id:
          "guest-1",
      },
      created:
        false,
    });

    bookingUpdateMock.mockResolvedValueOnce({
      id:
        "booking-1",
    });

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    const result =
      await service.upsertBooking(
        createBookingInput({
          externalStatus:
            "CANCELLED",
        }),
      );

    expect(result).toEqual({
      inserted: 0,
      updated: 1,
      skipped: 0,
    });

    expect(
      bookingUpdateMock,
    ).toHaveBeenCalledWith({
      where: {
        id:
          "booking-1",
      },

      data: {
        integrationConnectionId:
          null,

        propertyId:
          "property-1",

        ownerId:
          "owner-1",

        guestId:
          "guest-1",

        guestName:
          "Mario Rossi",

        guestEmail:
          "mario@example.com",

        guestPhone:
          "+39 333 1234567",

        checkIn:
          new Date(
            "2026-09-10T14:00:00.000Z",
          ),

        checkOut:
          new Date(
            "2026-09-13T10:00:00.000Z",
          ),

        nights:
          3,

        guests:
          2,

        grossAmount:
          450,

        currency:
          "EUR",

        bookingStatus:
          BookingStatus.CANCELLED,
      },
    });

    expect(
      emitEventMock,
    ).toHaveBeenCalledWith(
      {
        eventType:
          "BOOKING_CANCELLED",

        aggregateType:
          "BOOKING",

        aggregateId:
          "booking-1",

        payload: {
          bookingId:
            "booking-1",

          propertyId:
            "property-1",

          ownerId:
            "owner-1",

          guestName:
            "Mario Rossi",

          checkIn:
            "2026-09-10T14:00:00.000Z",

          checkOut:
            "2026-09-13T10:00:00.000Z",

          channel:
            BookingChannel.BOOKING,

          provider:
            "BOOKING_COM",

          integrationConnectionId:
            null,

          externalBookingId:
            "booking-ext-1",
        },

        idempotencyKey:
          "BOOKING_CANCELLED:booking-1",
      },
      transactionClient,
    );

    expect(
      emitEventMock,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        eventType:
          "BOOKING_UPDATED",
      }),
      expect.anything(),
    );
  });

  it("usa integrationConnectionId + externalBookingId per le nuove integrazioni", async () => {
    const propertyResolver =
      createPropertyResolver();

    bookingFindUniqueMock.mockResolvedValueOnce({
      ...createExistingBooking(),

      integrationConnectionId:
        "connection-1",
    });

    findOrCreateGuestMock.mockResolvedValueOnce({
      guest: {
        id:
          "guest-1",
      },
      created:
        false,
    });

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    const result =
      await service.upsertBooking(
        createBookingInput({
          provider:
            "ICAL",

          integrationConnectionId:
            "connection-1",

          channel:
            BookingChannel.AIRBNB,
        }),
      );

    expect(result).toEqual({
      inserted: 0,
      updated: 0,
      skipped: 1,
    });

    expect(
      propertyResolver.resolveProperty,
    ).toHaveBeenCalledWith({
      provider:
        "ICAL",

      externalPropertyId:
        "booking-property-1",

      integrationConnectionId:
        "connection-1",
    });

    expect(
      bookingFindUniqueMock,
    ).toHaveBeenCalledWith({
      where: {
        integrationConnectionId_externalBookingId:
          {
            integrationConnectionId:
              "connection-1",

            externalBookingId:
              "booking-ext-1",
          },
      },

      select: {
        id: true,

        integrationConnectionId:
          true,

        propertyId:
          true,

        ownerId:
          true,

        guestId:
          true,

        guestName:
          true,

        guestEmail:
          true,

        guestPhone:
          true,

        checkIn:
          true,

        checkOut:
          true,

        nights:
          true,

        guests:
          true,

        grossAmount:
          true,

        currency:
          true,

        bookingStatus:
          true,

        operationalStatus:
          true,
      },
    });

    expect(
      bookingFindFirstMock,
    ).not.toHaveBeenCalled();

    expect(
      bookingCreateMock,
    ).not.toHaveBeenCalled();

    expect(
      bookingUpdateMock,
    ).not.toHaveBeenCalled();

    expect(
      emitEventMock,
    ).not.toHaveBeenCalled();
  });

  it("fallisce quando la proprietà esterna non è associata a Horizon", async () => {
    const resolveProperty =
      vi.fn()
        .mockResolvedValueOnce(
          null,
        );

    const propertyResolver = {
      resolveProperty,
    } as ExternalPropertyResolver;

    const service =
      new PrismaBookingDomainService(
        propertyResolver,
      );

    await expect(
      service.upsertBooking(
        createBookingInput(),
      ),
    ).rejects.toThrow(
      'Nessun immobile Horizon associato alla proprietà esterna "booking-property-1" del provider "BOOKING_COM".',
    );

    expect(
      prismaTransactionMock,
    ).not.toHaveBeenCalled();

    expect(
      findOrCreateGuestMock,
    ).not.toHaveBeenCalled();

    expect(
      auditLogMock,
    ).not.toHaveBeenCalled();

    expect(
      emitEventMock,
    ).not.toHaveBeenCalled();
  });
});

function createPropertyResolver(): ExternalPropertyResolver {
  return {
    resolveProperty:
      vi.fn().mockResolvedValue({
        propertyId:
          "property-1",

        ownerId:
          "owner-1",
      }),
  };
}

function createExistingBooking() {
  return {
    id:
      "booking-1",

    integrationConnectionId:
      null,

    propertyId:
      "property-1",

    ownerId:
      "owner-1",

    guestId:
      "guest-1",

    guestName:
      "Mario Rossi",

    guestEmail:
      "mario@example.com",

    guestPhone:
      "+39 333 1234567",

    checkIn:
      new Date(
        "2026-09-10T14:00:00.000Z",
      ),

    checkOut:
      new Date(
        "2026-09-13T10:00:00.000Z",
      ),

    nights:
      3,

    guests:
      2,

    grossAmount:
      450,

    currency:
      "EUR",

    bookingStatus:
      BookingStatus.CONFIRMED,

    operationalStatus:
      BookingOperationalStatus.OK,
  };
}

function createBookingInput(
  overrides:
    Partial<BookingUpsertInput> = {},
): BookingUpsertInput {
  return {
    provider:
      "BOOKING_COM",

    externalBookingId:
      "booking-ext-1",

    channel:
      BookingChannel.BOOKING,

    externalPropertyId:
      "booking-property-1",

    guestFullName:
      "Mario Rossi",

    guestEmail:
      "mario@example.com",

    guestPhone:
      "+39 333 1234567",

    checkIn:
      new Date(
        "2026-09-10T14:00:00.000Z",
      ),

    checkOut:
      new Date(
        "2026-09-13T10:00:00.000Z",
      ),

    guests:
      2,

    grossAmount:
      450,

    currency:
      "EUR",

    externalStatus:
      "CONFIRMED",

    providerPayload: {
      source:
        "test",
    },

    ...overrides,
  };
}