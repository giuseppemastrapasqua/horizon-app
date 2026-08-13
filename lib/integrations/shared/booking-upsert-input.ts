import type { BookingChannel } from "@prisma/client";

import type { IntegrationProvider } from "./types";

export type BookingUpsertInput = {
  provider: IntegrationProvider;

  integrationConnectionId?: string;

  externalBookingId: string;

  channel: BookingChannel;

  externalPropertyId: string;

  guestFullName: string;
  guestEmail?: string;
  guestPhone?: string;

  checkIn: Date;
  checkOut: Date;

  guests: number;

  grossAmount: number;
  currency: string;

  externalStatus: string;

  providerPayload: unknown;
};