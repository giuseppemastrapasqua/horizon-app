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

  let scheduledConnections = 0;
  for (const connection of connections) {
    const channel = getJsonString(connection.config, "channel");
    if (channel !== BookingChannel.BOOKING && channel !== BookingChannel.AIRBNB) {
      continue;
    }
    await enqueueBackgroundJob({
      type: "BOOKING_SYNC",
      payload: {
        provider: channel === BookingChannel.AIRBNB ? "AIRBNB" : "BOOKING_COM",
        connectionId: connection.connectionId,
        propertyId: connection.propertyId,
        pageLimit: 50,
        maxPages: 20,
      },
      deduplicationKey:
        `booking-sync:ical:${connection.connectionId}:${connection.propertyId}`,
    });
    scheduledConnections += 1;
  }

  return scheduledConnections;
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
