type CheckInBooking = {
  id: string;
  guestName: string;
  checkIn: Date;
  operationalStatus: string;
  channel: string;
  property: {
    id: string;
    name: string;
  };
};

type CheckOutBooking = {
  id: string;
  guestName: string;
  checkOut: Date;
  operationalStatus: string;
  channel: string;
  property: {
    id: string;
    name: string;
  };
};

export function getTodayCheckIns<
  TBooking extends CheckInBooking,
>(
  bookings: TBooking[]
) {
  return bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guestName,
    checkIn: booking.checkIn,
    operationalStatus:
      booking.operationalStatus,
    channel: booking.channel,
    property: booking.property,
  }));
}

export function getTodayCheckOuts<
  TBooking extends CheckOutBooking,
>(
  bookings: TBooking[]
) {
  return bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guestName,
    checkOut: booking.checkOut,
    operationalStatus:
      booking.operationalStatus,
    channel: booking.channel,
    property: booking.property,
  }));
}