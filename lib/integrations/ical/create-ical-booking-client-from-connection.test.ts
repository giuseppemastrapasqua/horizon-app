import {
  BookingChannel,
  IntegrationTransport,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const connectionPropertyFindUniqueMock =
  vi.hoisted(() =>
    vi.fn(),
  );

vi.mock("@/lib/prisma", () => ({
  prisma: {
    integrationConnectionProperty: {
      findUnique:
        connectionPropertyFindUniqueMock,
    },
  },
}));

import { createIcalBookingClientFromConnection } from "./create-ical-booking-client-from-connection";

describe(
  "createIcalBookingClientFromConnection",
  () => {
    beforeEach(() => {
      connectionPropertyFindUniqueMock.mockReset();

      connectionPropertyFindUniqueMock.mockResolvedValue(
        createConnectionProperty(),
      );
    });

    it("crea un IcalBookingClient da una connessione salvata", async () => {
      const client =
        await createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        });

      expect(
        client.provider,
      ).toBe(
        "ICAL",
      );

      expect(
        connectionPropertyFindUniqueMock,
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
          id: true,

          externalPropertyId:
            true,

          config:
            true,

          connection: {
            select: {
              id: true,
              connectorKey: true,
              transport: true,
              enabled: true,
            },
          },
        },
      });
    });

    it("rifiuta una connessione inesistente", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce(
        null,
      );

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'Nessuna proprietà "property-1" associata alla connessione "connection-1".',
      );
    });

    it("rifiuta una connessione disabilitata", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce(
        createConnectionProperty({
          enabled:
            false,
        }),
      );

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'La connessione "connection-1" è disabilitata.',
      );
    });

    it("rifiuta una connessione con transport diverso da ICAL", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce(
        createConnectionProperty({
          transport:
            IntegrationTransport.API,
        }),
      );

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'La connessione "connection-1" non utilizza il trasporto ICAL.',
      );
    });

    it("rifiuta un connector diverso da ical", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce(
        createConnectionProperty({
          connectorKey:
            "booking-com",
        }),
      );

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'La connessione "connection-1" non utilizza il connector iCal.',
      );
    });

    it("rifiuta externalPropertyId mancante", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce({
        ...createConnectionProperty(),

        externalPropertyId:
          null,
      });

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'La proprietà "property-1" non contiene un externalPropertyId per la connessione iCal.',
      );
    });

    it("rifiuta feedUrl mancante", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce({
        ...createConnectionProperty(),

        config: {
          channel:
            BookingChannel.AIRBNB,
        },
      });

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        "La configurazione della proprietà iCal non contiene un feedUrl valido.",
      );
    });

    it("rifiuta channel non valido", async () => {
      connectionPropertyFindUniqueMock.mockResolvedValueOnce({
        ...createConnectionProperty(),

        config: {
          feedUrl:
            "https://calendar.example.com/feed.ics",

          channel:
            "INVALID",
        },
      });

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        'La configurazione della proprietà iCal contiene un channel non valido: "INVALID".',
      );
    });

    it("valida gli identificativi richiesti", async () => {
      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "   ",

          propertyId:
            "property-1",
        }),
      ).rejects.toThrow(
        "integrationConnectionId non valido.",
      );

      await expect(
        createIcalBookingClientFromConnection({
          connectionId:
            "connection-1",

          propertyId:
            "   ",
        }),
      ).rejects.toThrow(
        "propertyId non valido.",
      );

      expect(
        connectionPropertyFindUniqueMock,
      ).not.toHaveBeenCalled();
    });
  },
);

function createConnectionProperty(
  connectionOverrides: {
    id?: string;
    connectorKey?: string;
    transport?: IntegrationTransport;
    enabled?: boolean;
  } = {},
) {
  return {
    id:
      "connection-property-1",

    externalPropertyId:
      "airbnb-property-1",

    config: {
      feedUrl:
        "https://calendar.example.com/feed.ics",

      channel:
        BookingChannel.AIRBNB,
    },

    connection: {
      id:
        connectionOverrides.id ??
        "connection-1",

      connectorKey:
        connectionOverrides.connectorKey ??
        "ical",

      transport:
        connectionOverrides.transport ??
        IntegrationTransport.ICAL,

      enabled:
        connectionOverrides.enabled ??
        true,
    },
  };
}