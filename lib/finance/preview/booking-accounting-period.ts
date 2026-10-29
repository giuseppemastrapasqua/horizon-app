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
      { accountingMonth: { gte: monthStart, lt: nextMonthStart } },
      {
        accountingMonth: null,
        channel: "BOOKING" as const,
        checkOut: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      {
        accountingMonth: null,
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
