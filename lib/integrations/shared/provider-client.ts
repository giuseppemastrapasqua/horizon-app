import type {
  ExternalBookingPage,
  FetchExternalBookingsInput,
  IntegrationProvider,
  NormalizedExternalBooking,
  ProviderHealthCheck,
  VerifiedWebhook,
  VerifyWebhookInput,
} from "./types";

export interface BookingProviderClient {
  readonly provider: IntegrationProvider;

  fetchBooking(
    externalBookingId: string
  ): Promise<NormalizedExternalBooking | null>;

  fetchBookings(
    input?: FetchExternalBookingsInput
  ): Promise<ExternalBookingPage>;

  verifyWebhook(input: VerifyWebhookInput): Promise<VerifiedWebhook>;

  healthCheck(): Promise<ProviderHealthCheck>;
}