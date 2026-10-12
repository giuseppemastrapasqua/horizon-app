import type { BookingUpsertInput } from "./booking-upsert-input";
import type { NormalizedExternalBooking } from "./types";

export function mapExternalBookingToUpsertInput(
  booking: NormalizedExternalBooking,
): BookingUpsertInput {
  return {
    provider: booking.provider,

    integrationConnectionId:
  booking.integrationConnectionId,

    externalBookingId:
      booking.externalBookingId,

    channel: booking.channel,

    externalPropertyId:
      booking.externalPropertyId,

    guestFullName:
      booking.guest.fullName,

    guestEmail:
      booking.guest.email,

    guestPhone:
      booking.guest.phone,

    bookedAt: booking.bookedAt,

    checkIn: booking.checkIn,
    checkOut: booking.checkOut,

    guests: booking.guests,
    roomsBooked: booking.roomsBooked,

    grossAmount:
      booking.grossAmount,

    currency:
      booking.currency,

    externalStatus:
      booking.status,

    providerPayload:
      booking.rawPayload,
  };
}