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

const synchronizeIcalAvailabilityMock =
  vi.hoisted(() =>
    vi.fn(),
  );

const integrationConnectionPropertyFindUniqueMock =
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
  "./synchronize-ical-availability",
  () => ({
    synchronizeIcalAvailability:
      synchronizeIcalAvailabilityMock,
  }),
);

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationConnectionProperty: {
      findUnique:
        integrationConnectionPropertyFindUniqueMock,
    },

    integrationConnection: {
      update:
        integrationConnectionUpdateMock,
    },
  },
}));

import { synchronizeIcalConnectionProperty } from "./synchronize-ical-connection-property";

describe(
  "synchronizeIcalConnectionProperty",
  () => {
    beforeEach(() => {
      createIcalBookingClientMock.mockReset();

      synchronizeIcalAvailabilityMock.mockReset();

      integrationConnectionPropertyFindUniqueMock.mockReset();

      integrationConnectionUpdateMock.mockReset();

      createIcalBookingClientMock.mockResolvedValue({
        provider:
          "ICAL",
      });

      integrationConnectionPropertyFindUniqueMock.mockResolvedValue({
        id:
          "connection-property-1",

        propertyId:
          "property-1",
      });

      integrationConnectionUpdateMock.mockResolvedValue({
        id:
          "connection-1",
      });
    });

    it("sincronizza la disponibilità iCal e registra SUCCESS", async () => {
      const completedAt =
        new Date(
          "2026-08-11T10:30:00.000Z",
        );

      const synchronizationResult = {
        fetchedEvents:
          2,

        insertedBlocks:
          2,

        updatedBlocks:
          0,

        deletedBlocks:
          0,

        skippedEvents:
          0,

        startedAt:
          new Date(
            "2026-08-11T10:29:59.000Z",
          ),

        completedAt,

        durationMs:
          1000,
      };

      synchronizeIcalAvailabilityMock.mockResolvedValueOnce(
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
        integrationConnectionPropertyFindUniqueMock,
      ).toHaveBeenCalledWith({
        where: {
          connectionId_propertyId: {
            connectionId:
              "connection-1",

            propertyId:
              "property-1",
          },
        },

        select: {
          id:
            true,

          propertyId:
            true,
        },
      });

      expect(
        synchronizeIcalAvailabilityMock,
      ).toHaveBeenCalledWith({
        client: {
          provider:
            "ICAL",
        },

        integrationConnectionPropertyId:
          "connection-property-1",

        propertyId:
          "property-1",
      });

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

    it("ignora le opzioni legacy perché iCal viene riconciliato come snapshot completo", async () => {
      synchronizeIcalAvailabilityMock.mockResolvedValueOnce(
        {
          fetchedEvents:
            0,

          insertedBlocks:
            0,

          updatedBlocks:
            0,

          deletedBlocks:
            0,

          skippedEvents:
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

        updatedAfter:
          new Date(
            "2026-08-01T00:00:00.000Z",
          ),

        pageLimit:
          25,

        maxPages:
          4,
      });

      expect(
        synchronizeIcalAvailabilityMock,
      ).toHaveBeenCalledTimes(
        1,
      );

      expect(
        synchronizeIcalAvailabilityMock,
      ).toHaveBeenCalledWith({
        client: {
          provider:
            "ICAL",
        },

        integrationConnectionPropertyId:
          "connection-property-1",

        propertyId:
          "property-1",
      });
    });

    it("registra ERROR e rilancia quando la sincronizzazione fallisce", async () => {
      const synchronizationError =
        new Error(
          "Feed iCal non raggiungibile.",
        );

      synchronizeIcalAvailabilityMock.mockRejectedValueOnce(
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
        integrationConnectionPropertyFindUniqueMock,
      ).not.toHaveBeenCalled();

      expect(
        synchronizeIcalAvailabilityMock,
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

    it("registra ERROR quando il mapping non è disponibile", async () => {
      integrationConnectionPropertyFindUniqueMock.mockResolvedValueOnce(
        null,
      );

      await expect(
        synchronizeIcalConnectionProperty({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'Nessuna proprietà "property-1" associata alla connessione "connection-1".',
      );

      expect(
        synchronizeIcalAvailabilityMock,
      ).not.toHaveBeenCalled();

      expect(
        integrationConnectionUpdateMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data:
            expect.objectContaining({
              lastSyncStatus:
                "ERROR",
            }),
        }),
      );
    });

    it("non sostituisce l'errore originale se fallisce anche il salvataggio dello stato ERROR", async () => {
      const synchronizationError =
        new Error(
          "Errore originale.",
        );

      synchronizeIcalAvailabilityMock.mockRejectedValueOnce(
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
        integrationConnectionPropertyFindUniqueMock,
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
        integrationConnectionPropertyFindUniqueMock,
      ).not.toHaveBeenCalled();

      expect(
        integrationConnectionUpdateMock,
      ).not.toHaveBeenCalled();
    });

    it("normalizza connectionId e propertyId", async () => {
      synchronizeIcalAvailabilityMock.mockResolvedValueOnce(
        {
          fetchedEvents:
            0,

          insertedBlocks:
            0,

          updatedBlocks:
            0,

          deletedBlocks:
            0,

          skippedEvents:
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

      expect(
        integrationConnectionPropertyFindUniqueMock,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            connectionId_propertyId: {
              connectionId:
                "connection-1",

              propertyId:
                "property-1",
            },
          },
        }),
      );
    });
  },
);
