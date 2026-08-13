import type { BookingProviderClient } from "./provider-client";
import { mapExternalBookingToUpsertInput } from "./booking-mapper";
import type { BookingUpsertInput } from "./booking-upsert-input";
import type {
  FetchExternalBookingsInput,
  IntegrationProvider,
} from "./types";

const DEFAULT_MAX_PAGES = 100;

export type CollectExternalBookingsInput = Omit<
  FetchExternalBookingsInput,
  "cursor"
> & {
  maxPages?: number;
};

export type CollectExternalBookingsResult = {
  provider: IntegrationProvider;
  bookings: BookingUpsertInput[];
  fetchedBookings: number;
  processedPages: number;
};

function resolveMaxPages(maxPages?: number): number {
  if (maxPages === undefined) {
    return DEFAULT_MAX_PAGES;
  }

  if (!Number.isInteger(maxPages) || maxPages <= 0) {
    throw new Error(
      "The maximum number of integration pages must be a positive integer."
    );
  }

  return maxPages;
}

export async function collectExternalBookings(
  client: BookingProviderClient,
  input: CollectExternalBookingsInput = {}
): Promise<CollectExternalBookingsResult> {
  const maxPages = resolveMaxPages(input.maxPages);
  const bookings: BookingUpsertInput[] = [];
  const visitedCursors = new Set<string>();

  let cursor: string | undefined;
  let processedPages = 0;

  do {
    if (processedPages >= maxPages) {
      throw new Error(
        `External booking collection exceeded the limit of ${maxPages} pages for provider ${client.provider}.`
      );
    }

    const page = await client.fetchBookings({
      externalPropertyId: input.externalPropertyId,
      updatedAfter: input.updatedAfter,
      limit: input.limit,
      cursor,
    });

    processedPages += 1;

    bookings.push(
      ...page.bookings.map(mapExternalBookingToUpsertInput)
    );

    if (!page.hasMore) {
      break;
    }

    if (!page.nextCursor) {
      throw new Error(
        `Provider ${client.provider} returned hasMore=true without a next cursor.`
      );
    }

    if (visitedCursors.has(page.nextCursor)) {
      throw new Error(
        `Provider ${client.provider} returned the repeated cursor "${page.nextCursor}".`
      );
    }

    visitedCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  } while (true);

  return {
    provider: client.provider,
    bookings,
    fetchedBookings: bookings.length,
    processedPages,
  };
}