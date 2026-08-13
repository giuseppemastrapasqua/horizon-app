import { BookingChannel } from "@prisma/client";

import {
  EXTERNAL_BOOKING_STATUSES,
  INTEGRATION_PROVIDERS,
  type NormalizedExternalBooking,
} from "@/lib/integrations/shared/types";

export const BOOKING_COM_MOCK_BOOKINGS:
  NormalizedExternalBooking[] = [
    {
      provider:
        INTEGRATION_PROVIDERS.BOOKING_COM,

      channel:
        BookingChannel.BOOKING,

      externalBookingId:
        "booking-com-reservation-1001",

      externalPropertyId:
        "booking-com-property-101",

      status:
        EXTERNAL_BOOKING_STATUSES.CONFIRMED,

      guest: {
        fullName: "Mario Rossi",
        email: "mario@example.com",
        phone: "+39 333 1234567",
      },

      checkIn: new Date(
        "2026-09-10T14:00:00.000Z",
      ),

      checkOut: new Date(
        "2026-09-13T10:00:00.000Z",
      ),

      guests: 2,

      grossAmount: 450,

      currency: "EUR",

      updatedAt: new Date(
        "2026-08-10T12:00:00.000Z",
      ),

      rawPayload: {
        reservationId:
          "booking-com-reservation-1001",
        propertyId:
          "booking-com-property-101",
        status: "confirmed",
      },
    },

    {
      provider:
        INTEGRATION_PROVIDERS.BOOKING_COM,

      channel:
        BookingChannel.BOOKING,

      externalBookingId:
        "booking-com-reservation-1002",

      externalPropertyId:
        "booking-com-property-101",

      status:
        EXTERNAL_BOOKING_STATUSES.PENDING,

      guest: {
        fullName: "Giulia Bianchi",
        email: "giulia@example.com",
      },

      checkIn: new Date(
        "2026-09-20T14:00:00.000Z",
      ),

      checkOut: new Date(
        "2026-09-23T10:00:00.000Z",
      ),

      guests: 1,

      grossAmount: 320,

      currency: "EUR",

      updatedAt: new Date(
        "2026-08-10T12:10:00.000Z",
      ),

      rawPayload: {
        reservationId:
          "booking-com-reservation-1002",
        propertyId:
          "booking-com-property-101",
        status: "pending",
      },
    },

    {
      provider:
        INTEGRATION_PROVIDERS.BOOKING_COM,

      channel:
        BookingChannel.BOOKING,

      externalBookingId:
        "booking-com-reservation-1003",

      externalPropertyId:
        "booking-com-property-102",

      status:
        EXTERNAL_BOOKING_STATUSES.CANCELLED,

      guest: {
        fullName: "Luca Verdi",
        phone: "+39 333 7654321",
      },

      checkIn: new Date(
        "2026-10-05T14:00:00.000Z",
      ),

      checkOut: new Date(
        "2026-10-08T10:00:00.000Z",
      ),

      guests: 3,

      grossAmount: 510,

      currency: "EUR",

      updatedAt: new Date(
        "2026-08-10T12:20:00.000Z",
      ),

      rawPayload: {
        reservationId:
          "booking-com-reservation-1003",
        propertyId:
          "booking-com-property-102",
        status: "cancelled",
      },
    },
  ];

export function cloneBookingComMockBooking(
  booking: NormalizedExternalBooking,
): NormalizedExternalBooking {
  return {
    ...booking,

    guest: {
      ...booking.guest,
    },

    checkIn:
      new Date(
        booking.checkIn,
      ),

    checkOut:
      new Date(
        booking.checkOut,
      ),

    updatedAt:
      booking.updatedAt
        ? new Date(
            booking.updatedAt,
          )
        : undefined,

    rawPayload:
      cloneUnknown(
        booking.rawPayload,
      ),
  };
}

function cloneUnknown(
  value: unknown,
): unknown {
  if (
    value === null ||
    value === undefined
  ) {
    return value;
  }

  if (
    typeof structuredClone ===
    "function"
  ) {
    return structuredClone(
      value,
    );
  }

  return JSON.parse(
    JSON.stringify(value),
  ) as unknown;
}