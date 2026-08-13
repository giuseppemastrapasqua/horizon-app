import { integrationConfig } from "@/lib/integrations/shared/integration-config";
import {
  INTEGRATION_ERROR_CODES,
} from "@/lib/integrations/shared/error-codes";
import { IntegrationError } from "@/lib/integrations/shared/integration-error";
import type { BookingProviderClient } from "@/lib/integrations/shared/provider-client";
import {
  INTEGRATION_PROVIDERS,
  type ExternalBookingPage,
  type FetchExternalBookingsInput,
  type NormalizedExternalBooking,
  type ProviderHealthCheck,
  type VerifiedWebhook,
  type VerifyWebhookInput,
} from "@/lib/integrations/shared/types";

import { bookingComAuth } from "./booking-com-auth";
import { bookingComMockClient } from "./booking-com-mock-client";

export class BookingComApiClient
  implements BookingProviderClient
{
  readonly provider =
    INTEGRATION_PROVIDERS.BOOKING_COM;

  async fetchBooking(
    externalBookingId: string,
  ): Promise<NormalizedExternalBooking | null> {
    if (integrationConfig.bookingCom.useMock) {
      return bookingComMockClient.fetchBooking(
        externalBookingId,
      );
    }

    return this.ensureRealClientAvailable();
  }

  async fetchBookings(
    input: FetchExternalBookingsInput = {},
  ): Promise<ExternalBookingPage> {
    if (integrationConfig.bookingCom.useMock) {
      return bookingComMockClient.fetchBookings(
        input,
      );
    }

    return this.ensureRealClientAvailable();
  }

  async verifyWebhook(
    input: VerifyWebhookInput,
  ): Promise<VerifiedWebhook> {
    if (integrationConfig.bookingCom.useMock) {
      return bookingComMockClient.verifyWebhook(
        input,
      );
    }

    return this.ensureRealClientAvailable();
  }

  async healthCheck(): Promise<ProviderHealthCheck> {
    if (integrationConfig.bookingCom.useMock) {
      return bookingComMockClient.healthCheck();
    }

    return this.ensureRealClientAvailable();
  }

  private async ensureRealClientAvailable(): Promise<never> {
    if (!integrationConfig.bookingCom.enabled) {
      throw new IntegrationError({
        message:
          "L’integrazione Booking.com non è abilitata.",
        code:
          INTEGRATION_ERROR_CODES.CONFIGURATION_ERROR,
        provider: this.provider,
        retryable: false,
      });
    }

    if (
      !integrationConfig.bookingCom.clientId ||
      !integrationConfig.bookingCom.clientSecret
    ) {
      throw new IntegrationError({
        message:
          "Le credenziali Booking.com non sono configurate.",
        code:
          INTEGRATION_ERROR_CODES.CONFIGURATION_ERROR,
        provider: this.provider,
        retryable: false,
      });
    }

    await bookingComAuth.getAccessToken();

    throw new IntegrationError({
      message:
        "Il client Booking.com reale non è ancora implementato.",
      code:
        INTEGRATION_ERROR_CODES.CONFIGURATION_ERROR,
      provider: this.provider,
      retryable: false,
    });
  }
}

export const bookingComApiClient =
  new BookingComApiClient();