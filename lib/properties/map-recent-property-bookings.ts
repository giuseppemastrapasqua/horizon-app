import type { Booking } from "@prisma/client";

export type RecentPropertyBookingData = {
  id: string;
  guestName: string;
  channel: Booking["channel"];
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  grossAmount: number;
  bookingStatus: Booking["bookingStatus"];
  operationalStatus: Booking["operationalStatus"];
};

export function mapRecentPropertyBookings(
  bookings: Booking[],
  limit = 8,
): RecentPropertyBookingData[] {
  return bookings
    .slice(0, limit)
    .map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      channel: booking.channel,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      grossAmount: Number(booking.grossAmount),
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
    }));
}