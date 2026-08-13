type RevenueBooking = {
  grossAmount: unknown;
};

type StatusProperty = {
  status: string;
};

export function getTotalRevenue(
  bookings: RevenueBooking[]
) {
  return bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );
}

export function getAverageBookingRevenue(
  totalRevenue: number,
  bookingCount: number
) {
  return bookingCount > 0
    ? totalRevenue / bookingCount
    : 0;
}

export function getActiveProperties<
  TProperty extends StatusProperty,
>(
  properties: TProperty[]
) {
  return properties.filter(
    (property) => property.status === "ACTIVE"
  );
}