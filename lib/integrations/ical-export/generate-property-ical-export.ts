import {
  BookingChannel,
  BookingStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  IcalExportDestination,
} from "./security";

type CalendarEvent = {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
};

const EXPORTED_BOOKING_STATUSES = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
] as const;

export async function generatePropertyIcalExport(input: {
  propertyId: string;
  destination: IcalExportDestination;
}): Promise<string | null> {
  const property =
    await prisma.property.findUnique({
      where: {
        id: input.propertyId,
      },

      select: {
        id: true,
        name: true,

        bookings: {
          where: {
            bookingStatus: {
              in: [
                ...EXPORTED_BOOKING_STATUSES,
              ],
            },

            /*
             * Anti-loop:
             * il calendario destinato a Booking
             * non riesporta le prenotazioni
             * provenienti da Booking, ecc.
             */
            channel: {
              not: input.destination,
            },
          },

          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            channel: true,
          },
        },

        availabilityBlocks: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            source: true,
          },
        },
      },
    });

  if (!property) {
    return null;
  }

  const bookingEvents:
    CalendarEvent[] =
    property.bookings
      .filter(
        (booking) =>
          booking.checkOut >
          booking.checkIn,
      )
      .map((booking) => ({
        uid:
          `horizon-booking-${booking.id}@horizon`,

        start:
          booking.checkIn,

        end:
          booking.checkOut,

        /*
         * Privacy:
         * nessun nome ospite,
         * importo o riferimento interno.
         */
        summary:
          `Reserved - ${mapChannelLabel(
            booking.channel,
          )}`,
      }));

  const blockEvents:
    CalendarEvent[] =
    property.availabilityBlocks
      .filter(
        (block) =>
          block.endDate >
          block.startDate,
      )
      .map((block) => ({
        uid:
          `horizon-block-${block.id}@horizon`,

        start:
          block.startDate,

        end:
          block.endDate,

        summary:
          "Unavailable",
      }));

  const events = [
    ...bookingEvents,
    ...blockEvents,
  ].sort(
    (a, b) =>
      a.start.getTime() -
      b.start.getTime(),
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "PRODID:-//Horizon//Availability Calendar V1//IT",
    `X-WR-CALNAME:${escapeText(
      property.name,
    )}`,
  ];

  for (const event of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeText(event.uid)}`,
      `DTSTAMP:${formatTimestamp(
        new Date(),
      )}`,
      `DTSTART;VALUE=DATE:${formatDate(
        event.start,
      )}`,
      `DTEND;VALUE=DATE:${formatDate(
        event.end,
      )}`,
      `SUMMARY:${escapeText(
        event.summary,
      )}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push(
    "END:VCALENDAR",
    "",
  );

  return lines.join("\r\n");
}

function formatDate(
  value: Date,
): string {
  const year =
    value.getUTCFullYear();

  const month =
    String(
      value.getUTCMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      value.getUTCDate(),
    ).padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatTimestamp(
  value: Date,
): string {
  return value
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeText(
  value: string,
): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function mapChannelLabel(
  channel: BookingChannel,
): string {
  switch (channel) {
    case BookingChannel.BOOKING:
      return "Booking";

    case BookingChannel.AIRBNB:
      return "Airbnb";

    case BookingChannel.VRBO:
      return "Vrbo";

    case BookingChannel.DIRECT:
      return "Direct";

    case BookingChannel.OTHER:
      return "Other";
  }
}
