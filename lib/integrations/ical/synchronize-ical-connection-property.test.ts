import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const createIcalBookingClientMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const synchronizeExternalBookingsMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const integrationConnectionUpdateMock =
  vi.hoisted(() =>
    vi.fn(),
  );

vi.mock(
  "./create-ical-booking-client-from-connection",
  () => ({
    createIcalBookingClientFromConnection:
      createIcalBookingClientMock,
  }),
);

vi.mock(
  "../shared/synchronize-external-bookings",
  () => ({
    synchronizeExternalBookings:
      synchronizeExternalBookingsMock,
  }),
);

vi.mock(
  "../shared/prisma-booking-domain-service",
  () => ({
    prismaBookingDomainService: {
      upsertBooking:
        vi.fn(),
    },
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationConnection: {
      update:
        integrationConnectionUpdateMock,
    },
  },
}));

import { prismaBookingDomainService } from "../shared/prisma-booking-domain-service";

import { synchronizeIcalConnectionProperty } from "./synchronize-ical-connection-property";

describe(
  "synchronizeIcalConnectionProperty",
  () => {
    beforeEach(() => {
      createIcalBookingClientMock.mockReset();

      synchronizeExternalBookingsMock.mockReset();

      integrationConnectionUpdateMock.mockReset();

      createIcalBookingClientMock.mockResolvedValue(
        {
          provider:
            "ICAL",
        },
      );

      integrationConnectionUpdateMock.mockResolvedValue(
        {
          id:
            "connection-1",
        },
      );
    });

    it("sincronizza la property iCal e registra SUCCESS", async () => {
      const completedAt =
        new Date(
          "2026-08-11T10:30:00.000Z",
        );

      const synchronizationResult = {
        provider:
          "ICAL",

        bookings:
          [],

        fetchedBookings:
          2,

        processedPages:
          1,

        insertedBookings:
          2,

        updatedBookings:
          0,

        skippedBookings:
          0,

        startedAt:
          new Date(
            "2026-08-11T10:29:59.000Z",
          ),

        completedAt,

        durationMs:
          1000,
      };

      synchronizeExternalBookingsMock.mockResolvedValueOnce(
        synchronizationResult,
      );

      const result =
        await synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        });

      expect(result).toBe(
        synchronizationResult,
      );

      expect(
        createIcalBookingClientMock,
      ).toHaveBeenCalledWith({
        connectionId:
          "connection-1",

        propertyId:
          "property-1",
      });

      expect(
        synchronizeExternalBookingsMock,
      ).toHaveBeenCalledWith(
        {
          provider:
            "ICAL",
        },
        prismaBookingDomainService,
        {
          updatedAfter:
            undefined,

          pageLimit:
            undefined,

          maxPages:
            undefined,
        },
      );

      expect(
        integrationConnectionUpdateMock,
      ).toHaveBeenCalledWith({
        where: {
          id:
            "connection-1",
        },

        data: {
          lastSyncAt:
            completedAt,

          lastSyncStatus:
            "SUCCESS",

          lastSyncError:
            null,
        },
      });
    });

    it("propaga le opzioni di sincronizzazione", async () => {
      const updatedAfter =
        new Date(
          "2026-08-01T00:00:00.000Z",
        );

      synchronizeExternalBookingsMock.mockResolvedValueOnce(
        {
          provider:
            "ICAL",

          bookings:
            [],

          fetchedBookings:
            0,

          processedPages:
            1,

          insertedBookings:
            0,

          updatedBookings:
            0,

          skippedBookings:
            0,

          startedAt:
            new Date(
              "2026-08-11T10:00:00.000Z",
            ),

          completedAt:
            new Date(
              "2026-08-11T10:00:01.000Z",
            ),

          durationMs:
            1000,
        },
      );

      await synchronizeIcalConnectionProperty({
        connectionId:
          "connection-1",

        propertyId:
          "property-1",

        updatedAfter,

        pageLimit:
          25,

        maxPages:
          4,
      });

      expect(
        synchronizeExternalBookingsMock,
      ).toHaveBeenCalledWith(
        expect.anything(),
        prismaBookingDomainService,
        {
          updatedAfter,

          pageLimit:
            25,

          maxPages:
            4,
        },
      );
    });

    it("registra ERROR e rilancia quando la sincronizzazione fallisce", async () => {
      const synchronizationError =
        new Error(
          "Feed iCal non raggiungibile.",
        );

      synchronizeExternalBookingsMock.mockRejectedValueOnce(
        synchronizationError,
      );

      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toBe(
        synchronizationError,
      );

      expect(
        integrationConnectionUpdateMock,
      ).toHaveBeenCalledWith({
        where: {
          id:
            "connection-1",
        },

        data: {
          lastSyncAt:
            expect.any(Date),

          lastSyncStatus:
            "ERROR",

          lastSyncError:
            "Feed iCal non raggiungibile.",
        },
      });
    });

    it("registra ERROR quando fallisce la creazione del client", async () => {
      const factoryError =
        new Error(
          "Configurazione iCal non valida.",
        );

      createIcalBookingClientMock.mockRejectedValueOnce(
        factoryError,
      );

      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toBe(
        factoryError,
      );

      expect(
        synchronizeExternalBookingsMock,
      ).not.toHaveBeenCalled();

      expect(
        integrationConnectionUpdateMock,
      ).toHaveBeenCalledWith({
        where: {
          id:
            "connection-1",
        },

        data: {
          lastSyncAt:
            expect.any(Date),

          lastSyncStatus:
            "ERROR",

          lastSyncError:
            "Configurazione iCal non valida.",
        },
      });
    });

    it("non sostituisce l'errore originale se fallisce anche il salvataggio dello stato ERROR", async () => {
      const synchronizationError =
        new Error(
          "Errore originale.",
        );

      synchronizeExternalBookingsMock.mockRejectedValueOnce(
        synchronizationError,
      );

      integrationConnectionUpdateMock.mockRejectedValueOnce(
        new Error(
          "Database non disponibile.",
        ),
      );

      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toBe(
        synchronizationError,
      );
    });

    it("valida connectionId prima di accedere al database", async () => {
      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "   ",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        "integrationConnectionId non valido.",
      );

      expect(
        createIcalBookingClientMock,
      ).not.toHaveBeenCalled();

      expect(
        integrationConnectionUpdateMock,
      ).not.toHaveBeenCalled();
    });

    it("valida propertyId prima di avviare la sincronizzazione", async () => {
      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "   ",
        }),
      ).rejects.toThrow(
        "propertyId non valido.",
      );

      expect(
        createIcalBookingClientMock,
      ).not.toHaveBeenCalled();

      expect(
        integrationConnectionUpdateMock,
      ).not.toHaveBeenCalled();
    });

    it("normalizza connectionId e propertyId", async () => {
      synchronizeExternalBookingsMock.mockResolvedValueOnce(
        {
          provider:
            "ICAL",

          bookings:
            [],

          fetchedBookings:
            0,

          processedPages:
            1,

          insertedBookings:
            0,

          updatedBookings:
            0,

          skippedBookings:
            0,

          startedAt:
            new Date(
              "2026-08-11T10:00:00.000Z",
            ),

          completedAt:
            new Date(
              "2026-08-11T10:00:01.000Z",
            ),

          durationMs:
            1000,
        },
      );

      await synchronizeIcalConnectionProperty({
        connectionId:
          "  connection-1  ",

        propertyId:
          "  property-1  ",
      });

      expect(
        createIcalBookingClientMock,
      ).toHaveBeenCalledWith({
        connectionId:
          "connection-1",

        propertyId:
          "property-1",
      });
    });
  },
);