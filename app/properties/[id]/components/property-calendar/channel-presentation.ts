import {
  formatDateRange,
} from "./formatters";

import type {
  CalendarBooking,
} from "./types";
export function getChannelPresentation(
  booking: CalendarBooking,
) {
  const guestName =
    normalizeCalendarGuestName(
      booking.guestName,
    );

  switch (
    booking.channel
  ) {
    case "BOOKING":
      return {
        badge:
          "B",

        channelName:
          "Booking.com",

        label:
          guestName ??
          "Booking",

        title:
          guestName
            ? `Booking.com · ${guestName} · ${formatDateRange(
                booking,
              )}`
            : `Booking.com · ${formatDateRange(
                booking,
              )}`,

        className:
          "bg-blue-500 text-white",

        badgeClassName:
          "bg-white/20 text-white",
      };

    case "AIRBNB":
      return {
        badge:
          "A",

        channelName:
          "Airbnb",

        label:
          guestName ??
          "Airbnb",

        title:
          guestName
            ? `Airbnb · ${guestName} · ${formatDateRange(
                booking,
              )}`
            : `Airbnb · ${formatDateRange(
                booking,
              )}`,

        className:
          "bg-pink-500 text-white",

        badgeClassName:
          "bg-white/20 text-white",
      };

    case "VRBO":
      return {
        badge:
          "V",

        channelName:
          "Vrbo",

        label:
          guestName ??
          "Vrbo",

        title:
          guestName
            ? `Vrbo · ${guestName} · ${formatDateRange(
                booking,
              )}`
            : `Vrbo · ${formatDateRange(
                booking,
              )}`,

        className:
          "bg-orange-500 text-white",

        badgeClassName:
          "bg-white/20 text-white",
      };

    case "DIRECT":
      return {
        badge:
          "H",

        channelName:
          "Horizon",

        label:
          guestName ??
          "Horizon",

        title:
          guestName
            ? `Horizon · ${guestName} · ${formatDateRange(
                booking,
              )}`
            : `Horizon · ${formatDateRange(
                booking,
              )}`,

        className:
          "bg-slate-950 text-white",

        badgeClassName:
          "bg-white/15 text-white",
      };

    default:
      return {
        badge:
          "•",

        channelName:
          "Altro",

        label:
          guestName ??
          "Altro",

        title:
          guestName
            ? `Altro · ${guestName} · ${formatDateRange(
                booking,
              )}`
            : `Altro · ${formatDateRange(
                booking,
              )}`,

        className:
          "bg-slate-400 text-white",

        badgeClassName:
          "bg-white/20 text-white",
      };
  }
}



function normalizeCalendarGuestName(
  value: string,
): string | null {
  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  const hiddenExternalNames = [
    "CLOSED - Not available",
    "Not available",
    "Unavailable",
    "Blocked",
  ];

  if (
    hiddenExternalNames.some(
      (hiddenName) =>
        normalized.toLowerCase() ===
        hiddenName.toLowerCase(),
    )
  ) {
    return null;
  }

  return normalized;
}

