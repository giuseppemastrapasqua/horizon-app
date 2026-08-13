import type { BookingUpsertInput } from "./booking-upsert-input";
import { collectExternalBookings } from "./collect-external-bookings";
import type { BookingDomainService } from "./domain-booking-service";
import {
  INTEGRATION_ERROR_CODES,
} from "./error-codes";
import {
  IntegrationError,
  isIntegrationError,
} from "./integration-error";
import type { BookingProviderClient } from "./provider-client";
import type { IntegrationProvider } from "./types";

export type SynchronizeExternalBookingsInput = {
  externalPropertyId?: string;
  updatedAfter?: Date;
  pageLimit?: number;
  maxPages?: number;
};

export type SynchronizeExternalBookingsResult = {
  provider: IntegrationProvider;
  bookings: BookingUpsertInput[];
  fetchedBookings: number;
  processedPages: number;
  insertedBookings: number;
  updatedBookings: number;
  skippedBookings: number;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
};

function normalizeSynchronizationError(
  error: unknown,
  provider: IntegrationProvider,
): IntegrationError {
  if (isIntegrationError(error)) {
    return error;
  }

  return new IntegrationError({
    message:
      error instanceof Error
        ? error.message
        : `Unknown synchronization error for provider ${provider}.`,
    code: INTEGRATION_ERROR_CODES.PROVIDER_ERROR,
    provider,
    retryable: false,
    cause: error,
  });
}

export async function synchronizeExternalBookings(
  client: BookingProviderClient,
  domainService: BookingDomainService,
  input: SynchronizeExternalBookingsInput = {},
): Promise<SynchronizeExternalBookingsResult> {
  const startedAt = new Date();

  try {
    const collection = await collectExternalBookings(
      client,
      {
        externalPropertyId:
          input.externalPropertyId,
        updatedAfter: input.updatedAfter,
        limit: input.pageLimit,
        maxPages: input.maxPages,
      },
    );

    let insertedBookings = 0;
    let updatedBookings = 0;
    let skippedBookings = 0;

    for (const booking of collection.bookings) {
      const result =
        await domainService.upsertBooking(
          booking,
        );

      insertedBookings += result.inserted;
      updatedBookings += result.updated;
      skippedBookings += result.skipped;
    }

    const completedAt = new Date();

    return {
      provider: collection.provider,
      bookings: collection.bookings,
      fetchedBookings:
        collection.fetchedBookings,
      processedPages:
        collection.processedPages,
      insertedBookings,
      updatedBookings,
      skippedBookings,
      startedAt,
      completedAt,
      durationMs:
        completedAt.getTime() -
        startedAt.getTime(),
    };
  } catch (error) {
    throw normalizeSynchronizationError(
      error,
      client.provider,
    );
  }
}