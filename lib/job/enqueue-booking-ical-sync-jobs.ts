import {
  BookingChannel,
  IntegrationTransport,
  type Prisma,
} from "@prisma/client";

import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { prisma } from "@/lib/prisma";

export async function enqueueBookingIcalSyncJobs(): Promise<number> {
  const connections =
    await prisma.integrationConnectionProperty.findMany({
      where: {
        connection: {
          connectorKey: "ical",
          transport: IntegrationTransport.ICAL,
          enabled: true,
        },
      },
      select: {
        connectionId: true,
        propertyId: true,
        config: true,
      },
    });

  const bookingConnections = connections.filter(
    (connection) =>
      getJsonString(connection.config, "channel") ===
      BookingChannel.BOOKING,
  );

  for (const connection of bookingConnections) {
    await enqueueBackgroundJob({
      type: "BOOKING_SYNC",
      payload: {
        provider: "BOOKING_COM",
        connectionId: connection.connectionId,
        propertyId: connection.propertyId,
        pageLimit: 50,
        maxPages: 20,
      },
      deduplicationKey:
        `booking-sync:ical:${connection.connectionId}:${connection.propertyId}`,
    });
  }

  return bookingConnections.length;
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

  const property = value[key];

  return typeof property === "string"
    ? property
    : undefined;
}
