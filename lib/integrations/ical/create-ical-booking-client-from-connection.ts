import {
  BookingChannel,
  IntegrationTransport,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { IcalBookingClient } from "./ical-booking-client";

const ICAL_CONNECTOR_KEY = "ical";

type IcalPropertyConfig = {
  feedUrl: string;
  channel: BookingChannel;
};

export type CreateIcalBookingClientFromConnectionInput = {
  connectionId: string;
  propertyId: string;
};

export async function createIcalBookingClientFromConnection({
  connectionId,
  propertyId,
}: CreateIcalBookingClientFromConnectionInput): Promise<IcalBookingClient> {
  const normalizedConnectionId =
    connectionId.trim();

  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedConnectionId) {
    throw new Error(
      "integrationConnectionId non valido.",
    );
  }

  if (!normalizedPropertyId) {
    throw new Error(
      "propertyId non valido.",
    );
  }

  const connectionProperty =
    await prisma.integrationConnectionProperty.findUnique({
      where: {
        connectionId_propertyId: {
          connectionId:
            normalizedConnectionId,

          propertyId:
            normalizedPropertyId,
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

  if (!connectionProperty) {
    throw new Error(
      `Nessuna proprietà "${normalizedPropertyId}" associata alla connessione "${normalizedConnectionId}".`,
    );
  }

  if (
    connectionProperty.connection.id !==
    normalizedConnectionId
  ) {
    throw new Error(
      "La proprietà di integrazione non appartiene alla connessione richiesta.",
    );
  }

  if (
    !connectionProperty.connection.enabled
  ) {
    throw new Error(
      `La connessione "${normalizedConnectionId}" è disabilitata.`,
    );
  }

  if (
    connectionProperty.connection.transport !==
    IntegrationTransport.ICAL
  ) {
    throw new Error(
      `La connessione "${normalizedConnectionId}" non utilizza il trasporto ICAL.`,
    );
  }

  if (
    connectionProperty.connection.connectorKey
      .trim()
      .toLowerCase() !==
    ICAL_CONNECTOR_KEY
  ) {
    throw new Error(
      `La connessione "${normalizedConnectionId}" non utilizza il connector iCal.`,
    );
  }

  const externalPropertyId =
    connectionProperty.externalPropertyId?.trim();

  if (!externalPropertyId) {
    throw new Error(
      `La proprietà "${normalizedPropertyId}" non contiene un externalPropertyId per la connessione iCal.`,
    );
  }

  const config =
    parseIcalPropertyConfig(
      connectionProperty.config,
    );

  return new IcalBookingClient({
    integrationConnectionId:
      normalizedConnectionId,

    feedUrl:
      config.feedUrl,

    externalPropertyId,

    channel:
      config.channel,
  });
}

function parseIcalPropertyConfig(
  value: Prisma.JsonValue | null,
): IcalPropertyConfig {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new Error(
      "La configurazione della proprietà iCal non è valida.",
    );
  }

  const feedUrl =
    getStringProperty(
      value,
      "feedUrl",
    )?.trim();

  if (!feedUrl) {
    throw new Error(
      "La configurazione della proprietà iCal non contiene un feedUrl valido.",
    );
  }

  const channelValue =
    getStringProperty(
      value,
      "channel",
    )?.trim();

  const channel =
    parseBookingChannel(
      channelValue,
    );

  return {
    feedUrl,
    channel,
  };
}

function getStringProperty(
  value: Prisma.JsonObject,
  key: string,
): string | undefined {
  const property =
    value[key];

  return typeof property ===
    "string"
    ? property
    : undefined;
}

function parseBookingChannel(
  value?: string,
): BookingChannel {
  switch (value) {
    case BookingChannel.AIRBNB:
      return BookingChannel.AIRBNB;

    case BookingChannel.BOOKING:
      return BookingChannel.BOOKING;

    case BookingChannel.VRBO:
      return BookingChannel.VRBO;

    case BookingChannel.DIRECT:
      return BookingChannel.DIRECT;

    case BookingChannel.OTHER:
      return BookingChannel.OTHER;

    default:
      throw new Error(
        `La configurazione della proprietà iCal contiene un channel non valido: "${value ?? ""}".`,
      );
  }
}