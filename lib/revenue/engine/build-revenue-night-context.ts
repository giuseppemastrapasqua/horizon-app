import { prisma } from "@/lib/prisma";

import type {
  RevenueNightContext,
} from "./revenue-engine-types";

export async function buildRevenueNightContext(
  propertyId: string,
  date: Date,
): Promise<RevenueNightContext> {
  const targetDate =
    startOfUtcDay(date);

  const monthStart =
    new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        1,
      ),
    );

  const monthEndExclusive =
    new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth() + 1,
        1,
      ),
    );

  const [
    marketSignal,
    bookings,
    property,
  ] = await Promise.all([
    prisma.revenueDailySignal.findFirst({
      where: {
        propertyId,
        date: targetDate,
      },

      orderBy: {
        capturedAt: "desc",
      },
    }),

    prisma.booking.findMany({
      where: {
        propertyId,

        bookingStatus: {
          not: "CANCELLED",
        },

        checkIn: {
          lt: monthEndExclusive,
        },

        checkOut: {
          gt: monthStart,
        },
      },

      select: {
        checkIn: true,
        checkOut: true,
      },

      orderBy: {
        checkIn: "asc",
      },
    }),

    prisma.property.findUnique({
      where: {
        id:
          propertyId,
      },

      select: {
        maxGuests:
          true,

        bedrooms:
          true,

        bathrooms:
          true,

        city:
          true,

        zone:
          true,
      },
    }),
  ]);

  const daysInMonth =
    differenceInDays(
      monthEndExclusive,
      monthStart,
    );

  const occupiedNights =
    calculateOccupiedNights({
      bookings,
      monthStart,
      monthEndExclusive,
    });

  const propertyOccupancy =
    daysInMonth > 0
      ? Math.min(
          100,
          (
            occupiedNights /
            daysInMonth
          ) * 100,
        )
      : null;

  const gapBeforeNights =
    calculateGapBefore({
      bookings,
      date: targetDate,
    });

  const gapAfterNights =
    calculateGapAfter({
      bookings,
      date: targetDate,
    });

  const today =
    startOfUtcDay(
      new Date(),
    );

  const leadTimeDays =
    Math.max(
      0,
      differenceInDays(
        targetDate,
        today,
      ),
    );

  return {
    propertyId,

    date: targetDate,

    market: {
      medianPrice:
        numberOrNull(
          marketSignal
            ?.marketMedianPrice,
        ),

      occupancy:
        numberOrNull(
          marketSignal
            ?.marketOccupancy,
        ),

      demandIndex:
        numberOrNull(
          marketSignal
            ?.demandIndex,
        ),

      competitorAvailability:
        marketSignal
          ?.competitorAvailability ??
        null,

      confidence:
        numberOrNull(
          marketSignal
            ?.confidence,
        ),
    },

    property: {
      occupancy:
        propertyOccupancy,

      /*
       * Non lo inventiamo.
       * VerrÃ  calcolato quando
       * implementeremo il pickup
       * storico della property.
       */
      bookingPace: null,

      maxGuests:
        property?.maxGuests ??
        null,

      bedrooms:
        property?.bedrooms ??
        null,

      bathrooms:
        property?.bathrooms ??
        null,

      city:
        property?.city ??
        null,

      zone:
        property?.zone ??
        null,
    },

    calendar: {
      leadTimeDays,
      gapBeforeNights,
      gapAfterNights,
    },

    event: {
      /*
       * Usiamo eventScore soltanto
       * se proviene realmente dal
       * dataset Revenue salvato.
       */
      score:
        numberOrNull(
          marketSignal
            ?.eventScore,
        ),
    },
  };
}

function calculateOccupiedNights({
  bookings,
  monthStart,
  monthEndExclusive,
}: {
  bookings: Array<{
    checkIn: Date;
    checkOut: Date;
  }>;

  monthStart: Date;
  monthEndExclusive: Date;
}) {
  const occupied =
    new Set<string>();

  for (const booking of bookings) {
    let cursor =
      maxDate(
        startOfUtcDay(
          booking.checkIn,
        ),
        monthStart,
      );

    const end =
      minDate(
        startOfUtcDay(
          booking.checkOut,
        ),
        monthEndExclusive,
      );

    while (cursor < end) {
      occupied.add(
        dateKey(cursor),
      );

      cursor =
        addUtcDays(
          cursor,
          1,
        );
    }
  }

  return occupied.size;
}

function calculateGapBefore({
  bookings,
  date,
}: {
  bookings: Array<{
    checkIn: Date;
    checkOut: Date;
  }>;

  date: Date;
}) {
  const previousCheckOut =
    bookings
      .map((booking) =>
        startOfUtcDay(
          booking.checkOut,
        ),
      )
      .filter(
        (checkOut) =>
          checkOut <= date,
      )
      .sort(
        (left, right) =>
          right.getTime() -
          left.getTime(),
      )[0];

  if (!previousCheckOut) {
    return null;
  }

  return differenceInDays(
    date,
    previousCheckOut,
  );
}

function calculateGapAfter({
  bookings,
  date,
}: {
  bookings: Array<{
    checkIn: Date;
    checkOut: Date;
  }>;

  date: Date;
}) {
  const nextCheckIn =
    bookings
      .map((booking) =>
        startOfUtcDay(
          booking.checkIn,
        ),
      )
      .filter(
        (checkIn) =>
          checkIn >= date,
      )
      .sort(
        (left, right) =>
          left.getTime() -
          right.getTime(),
      )[0];

  if (!nextCheckIn) {
    return null;
  }

  return differenceInDays(
    nextCheckIn,
    date,
  );
}

function numberOrNull(
  value: unknown,
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function startOfUtcDay(
  date: Date,
) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

function differenceInDays(
  left: Date,
  right: Date,
) {
  return Math.round(
    (
      left.getTime() -
      right.getTime()
    ) /
      86_400_000,
  );
}

function addUtcDays(
  date: Date,
  days: number,
) {
  return new Date(
    date.getTime() +
      days * 86_400_000,
  );
}

function maxDate(
  left: Date,
  right: Date,
) {
  return left > right
    ? left
    : right;
}

function minDate(
  left: Date,
  right: Date,
) {
  return left < right
    ? left
    : right;
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}


