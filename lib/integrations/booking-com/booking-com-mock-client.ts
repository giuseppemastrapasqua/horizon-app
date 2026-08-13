import type { BookingProviderClient } from "../shared/provider-client";
import {
  INTEGRATION_PROVIDERS,
  PROVIDER_HEALTH_STATUSES,
  type ExternalBookingPage,
  type FetchExternalBookingsInput,
  type NormalizedExternalBooking,
  type ProviderHealthCheck,
  type VerifiedWebhook,
  type VerifyWebhookInput,
} from "../shared/types";
import {
  BOOKING_COM_MOCK_BOOKINGS,
  cloneBookingComMockBooking,
} from "./booking-com-mock";

const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;

function parseCursor(
  cursor?: string,
): number {
  if (!cursor) {
    return 0;
  }

  const parsedCursor =
    Number.parseInt(cursor, 10);

  if (
    !Number.isInteger(parsedCursor) ||
    parsedCursor < 0
  ) {
    throw new Error(
      `Invalid Booking.com mock cursor: ${cursor}`,
    );
  }

  return parsedCursor;
}

function resolveLimit(
  limit?: number,
): number {
  if (limit === undefined) {
    return DEFAULT_PAGE_LIMIT;
  }

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw new Error(
      "Booking.com mock page limit must be a positive integer.",
    );
  }

  return Math.min(
    limit,
    MAX_PAGE_LIMIT,
  );
}

export class BookingComMockClient
  implements BookingProviderClient
{
  readonly provider =
    INTEGRATION_PROVIDERS.BOOKING_COM;

  async fetchBooking(
    externalBookingId: string,
  ): Promise<NormalizedExternalBooking | null> {
    const booking =
      BOOKING_COM_MOCK_BOOKINGS.find(
        (candidate) =>
          candidate.externalBookingId ===
          externalBookingId,
      );

    return booking
      ? cloneBookingComMockBooking(
          booking,
        )
      : null;
  }

  async fetchBookings(
    input: FetchExternalBookingsInput = {},
  ): Promise<ExternalBookingPage> {
    const offset = parseCursor(
      input.cursor,
    );

    const limit = resolveLimit(
      input.limit,
    );

    const filteredBookings =
      BOOKING_COM_MOCK_BOOKINGS.filter(
        (booking) => {
          if (
            input.externalPropertyId &&
            booking.externalPropertyId !==
              input.externalPropertyId
          ) {
            return false;
          }

          if (
            input.updatedAfter &&
            (!booking.updatedAt ||
              booking.updatedAt <=
                input.updatedAfter)
          ) {
            return false;
          }

          return true;
        },
      ).sort((left, right) => {
        const leftUpdatedAt =
          left.updatedAt?.getTime() ?? 0;

        const rightUpdatedAt =
          right.updatedAt?.getTime() ?? 0;

        return (
          leftUpdatedAt -
          rightUpdatedAt
        );
      });

    const pageBookings =
      filteredBookings
        .slice(
          offset,
          offset + limit,
        )
        .map(
          cloneBookingComMockBooking,
        );

    const nextOffset =
      offset + pageBookings.length;

    const hasMore =
      nextOffset <
      filteredBookings.length;

    return {
      bookings: pageBookings,
      hasMore,
      nextCursor: hasMore
        ? String(nextOffset)
        : undefined,
    };
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhook> {
    const signature =
      input.headers.get(
        "x-booking-signature",
      );

    if (
      signature !==
      "booking-com-mock-signature"
    ) {
      throw new Error(
        "Invalid Booking.com mock webhook signature.",
      );
    }

    let payload: unknown;

    try {
      payload = JSON.parse(
        input.rawBody,
      );
    } catch (error) {
      throw new Error(
        "Invalid Booking.com mock webhook payload.",
        {
          cause: error,
        },
      );
    }

    const webhookPayload =
      typeof payload === "object" &&
      payload !== null
        ? (payload as Record<
            string,
            unknown
          >)
        : {};

    return {
      provider: this.provider,
      eventType:
        typeof webhookPayload.eventType ===
        "string"
          ? webhookPayload.eventType
          : "reservation.updated",
      externalEventId:
        typeof webhookPayload.eventId ===
        "string"
          ? webhookPayload.eventId
          : undefined,
      occurredAt:
        typeof webhookPayload.occurredAt ===
        "string"
          ? new Date(
              webhookPayload.occurredAt,
            )
          : undefined,
      payload,
    };
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    return {
      provider: this.provider,
      status:
        PROVIDER_HEALTH_STATUSES.HEALTHY,
      checkedAt: new Date(),
      message:
        "Booking.com mock client is available.",
    };
  }
}

export const bookingComMockClient =
  new BookingComMockClient();