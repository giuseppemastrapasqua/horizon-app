import type { BookingChannel } from "@prisma/client";

export const INTEGRATION_PROVIDERS = {
  BOOKING_COM: "BOOKING_COM",
  AIRBNB: "AIRBNB",
  VRBO: "VRBO",
  ICAL: "ICAL",
  ALLOGGIATI_WEB: "ALLOGGIATI_WEB",
  ISTAT: "ISTAT",
  SOGGIORNIAMO: "SOGGIORNIAMO",
  STRIPE: "STRIPE",
} as const;

export type IntegrationProvider =
  (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];

export const EXTERNAL_BOOKING_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CHECKED_IN: "CHECKED_IN",
  CHECKED_OUT: "CHECKED_OUT",
  CANCELLED: "CANCELLED",
} as const;

export type ExternalBookingStatus =
  (typeof EXTERNAL_BOOKING_STATUSES)[keyof typeof EXTERNAL_BOOKING_STATUSES];

export type NormalizedExternalGuest = {
  fullName: string;
  email?: string;
  phone?: string;
};

export type NormalizedExternalBooking = {
  provider: IntegrationProvider;

  integrationConnectionId?: string;

  channel: BookingChannel;

  externalBookingId: string;
  externalPropertyId: string;

  status: ExternalBookingStatus;

  guest: NormalizedExternalGuest;

  checkIn: Date;
  checkOut: Date;

  guests: number;
  grossAmount: number;
  currency: string;

  updatedAt?: Date;
  rawPayload: unknown;
};

export type ExternalBookingPage = {
  bookings: NormalizedExternalBooking[];
  nextCursor?: string;
  hasMore: boolean;
};

export type FetchExternalBookingsInput = {
  externalPropertyId?: string;
  updatedAfter?: Date;
  cursor?: string;
  limit?: number;
};

export type VerifyWebhookInput = {
  headers: Headers;
  rawBody: string;
};

export type VerifiedWebhook = {
  provider: IntegrationProvider;
  eventType: string;
  externalEventId?: string;
  occurredAt?: Date;
  payload: unknown;
};

export const PROVIDER_HEALTH_STATUSES = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type ProviderHealthStatus =
  (typeof PROVIDER_HEALTH_STATUSES)[keyof typeof PROVIDER_HEALTH_STATUSES];

export type ProviderHealthCheck = {
  provider: IntegrationProvider;
  status: ProviderHealthStatus;
  checkedAt: Date;
  message?: string;
};

export type BookingSyncJobPayload = {
  provider: IntegrationProvider;
  externalPropertyId?: string;
  updatedAfter?: string;
  pageLimit?: number;
  maxPages?: number;
};