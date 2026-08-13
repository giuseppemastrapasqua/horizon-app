type BookingLike = {
  checkIn: Date;
  checkOut: Date;
  operationalStatus: string;
};

export function getFutureBookings<TBooking extends BookingLike>(
  bookings: TBooking[],
  now: Date
) {
  return bookings.filter((booking) => booking.checkIn >= now);
}

export function getOperationalAlerts<TBooking extends BookingLike>(
  bookings: TBooking[]
) {
  return bookings.filter(
    (booking) => booking.operationalStatus !== "OK"
  );
}

export function getNextCheckIns<TBooking extends BookingLike>(
  bookings: TBooking[],
  limit = 5
) {
  return [...bookings]
    .sort(
      (first, second) =>
        first.checkIn.getTime() - second.checkIn.getTime()
    )
    .slice(0, limit);
}

export function getNextCheckOuts<TBooking extends BookingLike>(
  bookings: TBooking[],
  limit = 5
) {
  return [...bookings]
    .sort(
      (first, second) =>
        first.checkOut.getTime() - second.checkOut.getTime()
    )
    .slice(0, limit);
}