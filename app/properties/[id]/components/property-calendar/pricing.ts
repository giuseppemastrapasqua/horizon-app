import type {
  CalendarPriceOverride,
} from "./types";

import {
  dateKey,
} from "./utils/dates";

export function getCalendarDayPricing({
  date,
  priceOverrides,
  rangeStart,
  rangeEnd,
  nightlyPrice,
  includedGuests,
}: {
  date: Date;

  priceOverrides:
    CalendarPriceOverride[];

  rangeStart: string;
  rangeEnd: string;

  nightlyPrice: string;
  includedGuests: string;
}): {
  price: number;
  guests: number | null;
} | null {
  const key =
    dateKey(date);

  /*
   * Preview locale.
   */
  if (
    rangeStart &&
    rangeEnd &&
    key >= rangeStart &&
    key <= rangeEnd
  ) {
    const previewPrice =
      Number(
        nightlyPrice,
      );

    const previewGuests =
      Number(
        includedGuests,
      );

    if (
      nightlyPrice.trim() &&
      Number.isFinite(
        previewPrice,
      )
    ) {
      return {
        price:
          previewPrice,

        guests:
          includedGuests.trim() &&
          Number.isFinite(
            previewGuests,
          )
            ? previewGuests
            : null,
      };
    }
  }

  /*
   * Dati salvati nel database.
   */
  let result:
    {
      price: number;
      guests: number | null;
    }
    | null =
    null;

  for (
    const override
    of priceOverrides
  ) {
    const start =
      override.startDate.slice(
        0,
        10,
      );

    const end =
      override.endDate.slice(
        0,
        10,
      );

    if (
      key >= start &&
      key <= end &&
      override.nightlyPrice !==
        null
    ) {
      result = {
        price:
          override.nightlyPrice,

        guests:
          override.occupancyIncluded,
      };
    }
  }

  return result;
}
