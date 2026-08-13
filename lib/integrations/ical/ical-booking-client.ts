import { BookingChannel } from "@prisma/client";

import type { BookingProviderClient } from "@/lib/integrations/shared/provider-client";
import {
  INTEGRATION_PROVIDERS,
  PROVIDER_HEALTH_STATUSES,
  type ExternalBookingPage,
  type FetchExternalBookingsInput,
  type NormalizedExternalBooking,
  type ProviderHealthCheck,
  type VerifiedWebhook,
  type VerifyWebhookInput,
} from "@/lib/integrations/shared/types";

import { fetchIcalCalendar } from "./fetch-ical-calendar";
import { mapIcalEventToBooking } from "./map-ical-event-to-booking";
import { parseIcalCalendar } from "./parse-ical-calendar";

type IcalBookingClientConfig = {
  integrationConnectionId: string;

  feedUrl: string;
  externalPropertyId: string;

  channel: BookingChannel;
};

export class IcalBookingClient
  implements BookingProviderClient
{
  readonly provider =
    INTEGRATION_PROVIDERS.ICAL;

  constructor(
    private readonly config:
      IcalBookingClientConfig,
  ) {
    validateConfig(config);
  }

  async fetchBooking(
    externalBookingId: string,
  ): Promise<NormalizedExternalBooking | null> {
    const normalizedExternalBookingId =
      externalBookingId.trim();

    if (!normalizedExternalBookingId) {
      return null;
    }

    const bookings =
      await this.loadBookings();

    return (
      bookings.find(
        (booking) =>
          booking.externalBookingId ===
          normalizedExternalBookingId,
      ) ?? null
    );
  }

  async fetchBookings(
    input: FetchExternalBookingsInput = {},
  ): Promise<ExternalBookingPage> {
    validateFetchInput(input);

    if (
      input.externalPropertyId &&
      input.externalPropertyId !==
        this.config.externalPropertyId
    ) {
      return {
        bookings: [],
        hasMore: false,
      };
    }

    const allBookings =
      await this.loadBookings();

    const filteredBookings =
      allBookings.filter(
        (booking) => {
          if (
            input.updatedAfter &&
            booking.updatedAt &&
            booking.updatedAt <=
              input.updatedAfter
          ) {
            return false;
          }

          return true;
        },
      );

    const offset =
      parseCursor(
        input.cursor,
      );

    const limit =
      input.limit ??
      filteredBookings.length;

    const bookings =
      filteredBookings.slice(
        offset,
        offset + limit,
      );

    const nextOffset =
      offset +
      bookings.length;

    const hasMore =
      nextOffset <
      filteredBookings.length;

    return {
      bookings,
      hasMore,

      ...(hasMore
        ? {
            nextCursor:
              String(
                nextOffset,
              ),
          }
        : {}),
    };
  }

  async verifyWebhook(
    _input: VerifyWebhookInput,
  ): Promise<VerifiedWebhook> {
    throw new Error(
      "Le integrazioni iCal non supportano webhook.",
    );
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    const checkedAt =
      new Date();

    try {
      const body =
        await fetchIcalCalendar(
          this.config.feedUrl,
        );

      parseIcalCalendar(body);

      return {
        provider:
          this.provider,

        status:
          PROVIDER_HEALTH_STATUSES.HEALTHY,

        checkedAt,

        message:
          "Feed iCal raggiungibile e valido.",
      };
    } catch (error) {
      return {
        provider:
          this.provider,

        status:
          PROVIDER_HEALTH_STATUSES.UNAVAILABLE,

        checkedAt,

        message:
          error instanceof Error
            ? error.message
            : "Errore sconosciuto durante il controllo del feed iCal.",
      };
    }
  }

  private async loadBookings(): Promise<
    NormalizedExternalBooking[]
  > {
    const body =
      await fetchIcalCalendar(
        this.config.feedUrl,
      );

    const events =
      parseIcalCalendar(body);

    return events.map(
      (event) => {
        const booking =
          mapIcalEventToBooking({
            event,

            externalPropertyId:
              this.config.externalPropertyId,

            channel:
              this.config.channel,
          });

        return {
          ...booking,

          integrationConnectionId:
            this.config.integrationConnectionId,
        };
      },
    );
  }
}

function validateConfig(
  config: IcalBookingClientConfig,
): void {
  if (
    !config.integrationConnectionId.trim()
  ) {
    throw new Error(
      "La configurazione iCal non contiene un integrationConnectionId valido.",
    );
  }

  if (
    !config.feedUrl.trim()
  ) {
    throw new Error(
      "La configurazione iCal non contiene un feedUrl valido.",
    );
  }

  if (
    !config.externalPropertyId.trim()
  ) {
    throw new Error(
      "La configurazione iCal non contiene un externalPropertyId valido.",
    );
  }
}

function validateFetchInput(
  input: FetchExternalBookingsInput,
): void {
  if (
    input.limit !== undefined &&
    (
      !Number.isInteger(
        input.limit,
      ) ||
      input.limit <= 0
    )
  ) {
    throw new Error(
      "Il limite di paginazione iCal deve essere un intero positivo.",
    );
  }
}

function parseCursor(
  cursor?: string,
): number {
  if (cursor === undefined) {
    return 0;
  }

  const offset =
    Number(cursor);

  if (
    !Number.isInteger(offset) ||
    offset < 0
  ) {
    throw new Error(
      "Il cursore iCal non è valido.",
    );
  }

  return offset;
}