import { bookingComApiClient } from "@/lib/integrations/booking-com/booking-com-api-client";

import type { BookingProviderClient } from "./provider-client";
import {
  INTEGRATION_PROVIDERS,
  type IntegrationProvider,
} from "./types";

const bookingProviderClients: Partial<
  Record<IntegrationProvider, BookingProviderClient>
> = {
  [INTEGRATION_PROVIDERS.BOOKING_COM]:
    bookingComApiClient,
};

export function getBookingProviderClient(
  provider: IntegrationProvider,
): BookingProviderClient {
  const client = bookingProviderClients[provider];

  if (!client) {
    throw new Error(
      `Booking provider "${provider}" is not implemented yet.`,
    );
  }

  return client;
}