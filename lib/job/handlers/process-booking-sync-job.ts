import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import { synchronizeIcalConnectionProperty } from "@/lib/integrations/ical/synchronize-ical-connection-property";
import { prismaBookingDomainService } from "@/lib/integrations/shared/prisma-booking-domain-service";
import { getBookingProviderClient } from "@/lib/integrations/shared/provider-registry";
import { synchronizeExternalBookings } from "@/lib/integrations/shared/synchronize-external-bookings";
import {
  INTEGRATION_PROVIDERS,
  type BookingSyncJobPayload,
} from "@/lib/integrations/shared/types";

type ParsedBookingSyncJobPayload =
  BookingSyncJobPayload & {
    connectionId?: string;
    propertyId?: string;
  };

function getPayload(
  job: BackgroundJob,
): ParsedBookingSyncJobPayload {
  const payload =
    (job.payload as Prisma.JsonObject | null) ?? {};

  return {
    provider:
      typeof payload.provider === "string"
        ? (payload.provider as BookingSyncJobPayload["provider"])
        : INTEGRATION_PROVIDERS.BOOKING_COM,

    externalPropertyId:
      typeof payload.externalPropertyId === "string"
        ? payload.externalPropertyId
        : undefined,

    updatedAfter:
      typeof payload.updatedAfter === "string"
        ? payload.updatedAfter
        : undefined,

    pageLimit:
      typeof payload.pageLimit === "number"
        ? payload.pageLimit
        : undefined,

    maxPages:
      typeof payload.maxPages === "number"
        ? payload.maxPages
        : undefined,

    connectionId:
      typeof payload.connectionId === "string"
        ? payload.connectionId
        : undefined,

    propertyId:
      typeof payload.propertyId === "string"
        ? payload.propertyId
        : undefined,
  };
}

export async function processBookingSyncJob(
  job: BackgroundJob,
): Promise<void> {
  const payload = getPayload(job);

  const hasIcalIdentity =
    Boolean(payload.connectionId) ||
    Boolean(payload.propertyId);

  if (hasIcalIdentity) {
    if (!payload.connectionId || !payload.propertyId) {
      throw new Error(
        "Payload BOOKING_SYNC iCal incompleto: connectionId e propertyId sono obbligatori.",
      );
    }

    await synchronizeIcalConnectionProperty({
      connectionId: payload.connectionId,
      propertyId: payload.propertyId,
      pageLimit: payload.pageLimit,
      maxPages: payload.maxPages,
    });

    return;
  }

  const client = getBookingProviderClient(
    payload.provider,
  );

  await synchronizeExternalBookings(
    client,
    prismaBookingDomainService,
    {
      externalPropertyId:
        payload.externalPropertyId,
      updatedAfter: payload.updatedAfter
        ? new Date(payload.updatedAfter)
        : undefined,
      pageLimit: payload.pageLimit,
      maxPages: payload.maxPages,
    },
  );
}
