import type {
  BackgroundJob,
  Prisma,
} from "@prisma/client";

import { prismaBookingDomainService } from "@/lib/integrations/shared/prisma-booking-domain-service";
import { getBookingProviderClient } from "@/lib/integrations/shared/provider-registry";
import { synchronizeExternalBookings } from "@/lib/integrations/shared/synchronize-external-bookings";
import {
  INTEGRATION_PROVIDERS,
  type BookingSyncJobPayload,
} from "@/lib/integrations/shared/types";

function getPayload(
  job: BackgroundJob,
): BookingSyncJobPayload {
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
  };
}

export async function processBookingSyncJob(
  job: BackgroundJob,
): Promise<void> {
  const payload = getPayload(job);

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