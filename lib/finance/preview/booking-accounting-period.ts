type BookingAccountingPeriodInput = {
  monthStart: Date;
  nextMonthStart: Date;
};

export function buildBookingAccountingPeriodWhere({
  monthStart,
  nextMonthStart,
}: BookingAccountingPeriodInput) {
  return {
    OR: [
      {
        channel: "BOOKING" as const,
        checkOut: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      {
        channel: {
          not: "BOOKING" as const,
        },
        checkIn: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
    ],
  };
}
