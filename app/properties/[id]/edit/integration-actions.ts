"use server";

import {
  BookingChannel,
  IntegrationTransport,
  type Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePropertyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { synchronizeIcalConnectionProperty } from "@/lib/integrations/ical/synchronize-ical-connection-property";
import { upsertIntegrationPropertyMapping } from "@/lib/integrations/shared/upsert-integration-property-mapping";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "@/lib/integrations/shared/types";

function isIntegrationProvider(
  value: string,
): value is IntegrationProvider {
  return Object.values(
    INTEGRATION_PROVIDERS,
  ).includes(value as IntegrationProvider);
}

export async function updatePropertyIntegrationAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const providerValue = String(
    formData.get("provider") ?? "",
  ).trim();

  const externalPropertyId = String(
    formData.get("externalPropertyId") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  await requirePropertyRole(
    propertyId,
    ["OWNER", "MANAGER"],
  );

  if (
    !providerValue ||
    !isIntegrationProvider(providerValue)
  ) {
    throw new Error(
      `Provider di integrazione non valido: "${providerValue}".`,
    );
  }

  if (!externalPropertyId) {
    throw new Error(
      "Inserisci l'identificativo esterno dell'immobile.",
    );
  }

  if (
    providerValue ===
    INTEGRATION_PROVIDERS.ALLOGGIATI_WEB
  ) {
    throw new Error(
      "Alloggiati Web deve essere configurato nella sezione Compliance.",
    );
  }

  await upsertIntegrationPropertyMapping({
    provider: providerValue,
    propertyId,
    externalPropertyId,
  });

  if (
    providerValue ===
    INTEGRATION_PROVIDERS.BOOKING_COM
  ) {
    const feedUrl = String(
      formData.get("feedUrl") ?? "",
    ).trim();

    if (!feedUrl) {
      throw new Error(
        "Inserisci l'URL del calendario iCal esportato da Booking.com.",
      );
    }

    validateFeedUrl(feedUrl);

    await saveBookingIcalConnection({
      propertyId,
      externalPropertyId,
      feedUrl,
    });
  }

  revalidatePropertyPaths(propertyId);
}

export async function synchronizePropertyIntegrationAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const providerValue = String(
    formData.get("provider") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  await requirePropertyRole(
    propertyId,
    ["OWNER", "MANAGER"],
  );

  if (!isIntegrationProvider(providerValue)) {
    throw new Error(
      `Provider di integrazione non valido: "${providerValue}".`,
    );
  }

  if (
    providerValue !==
    INTEGRATION_PROVIDERS.BOOKING_COM
  ) {
    throw new Error(
      `La sincronizzazione per "${providerValue}" non è ancora disponibile.`,
    );
  }

  const connections =
    await prisma.integrationConnectionProperty.findMany({
      where: {
        propertyId,
        connection: {
          connectorKey: "ical",
          transport:
            IntegrationTransport.ICAL,
          enabled: true,
        },
      },
      select: {
        connectionId: true,
        config: true,
      },
    });

  const bookingConnection =
    connections.find(
      (connection) =>
        getJsonString(
          connection.config,
          "channel",
        ) === BookingChannel.BOOKING,
    );

  if (!bookingConnection) {
    throw new Error(
      "Calendario iCal Booking.com non configurato per questo immobile.",
    );
  }

  await synchronizeIcalConnectionProperty({
    connectionId:
      bookingConnection.connectionId,
    propertyId,
    pageLimit: 50,
    maxPages: 20,
  });

  revalidatePropertyPaths(propertyId);
}

async function saveBookingIcalConnection({
  propertyId,
  externalPropertyId,
  feedUrl,
}: {
  propertyId: string;
  externalPropertyId: string;
  feedUrl: string;
}): Promise<void> {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
      },
    });

  if (!property) {
    throw new Error(
      "Immobile Horizon non trovato.",
    );
  }

  const existingProperties =
    await prisma.integrationConnectionProperty.findMany({
      where: {
        propertyId,
        connection: {
          connectorKey: "ical",
          transport:
            IntegrationTransport.ICAL,
        },
      },
      select: {
        id: true,
        connectionId: true,
        config: true,
      },
    });

  const existing =
    existingProperties.find(
      (item) =>
        getJsonString(
          item.config,
          "channel",
        ) === BookingChannel.BOOKING,
    );

  const config: Prisma.InputJsonObject = {
    feedUrl,
    channel:
      BookingChannel.BOOKING,
  };

  if (existing) {
    await prisma.$transaction([
      prisma.integrationConnection.update({
        where: {
          id: existing.connectionId,
        },
        data: {
          enabled: true,
          name:
            `Booking.com iCal · ${property.name}`,
        },
      }),
      prisma.integrationConnectionProperty.update({
        where: {
          id: existing.id,
        },
        data: {
          externalPropertyId,
          config,
        },
      }),
    ]);

    return;
  }

  await prisma.integrationConnection.create({
    data: {
      ownerId: property.ownerId,
      connectorKey: "ical",
      transport:
        IntegrationTransport.ICAL,
      name:
        `Booking.com iCal · ${property.name}`,
      enabled: true,
      properties: {
        create: {
          propertyId,
          externalPropertyId,
          config,
        },
      },
    },
  });
}

function validateFeedUrl(
  value: string,
): void {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(
      "L'URL del calendario Booking.com non è valido.",
    );
  }

  if (
    url.protocol !== "https:" &&
    url.protocol !== "http:"
  ) {
    throw new Error(
      "Il calendario Booking.com deve utilizzare un URL HTTP o HTTPS.",
    );
  }
}

function getJsonString(
  value: Prisma.JsonValue | null,
  key: string,
): string | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const property =
    value[key];

  return typeof property === "string"
    ? property
    : undefined;
}

function revalidatePropertyPaths(
  propertyId: string,
): void {
  revalidatePath(
    `/properties/${propertyId}`,
  );

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );

  revalidatePath("/calendar");
  revalidatePath("/bookings");
}