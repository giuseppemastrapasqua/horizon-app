import {
  BookingChannel,
} from "@prisma/client";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EXTERNAL_BOOKING_STATUSES,
  INTEGRATION_PROVIDERS,
} from "@/lib/integrations/shared/types";

import { mapIcalEventToBooking } from "./map-ical-event-to-booking";
import type { IcalBookingEvent } from "./types";

describe("mapIcalEventToBooking", () => {
  it("normalizza una prenotazione iCal", () => {
    const booking =
      mapIcalEventToBooking({
        event:
          createEvent(),

        externalPropertyId:
          "property-airbnb-123",

        channel:
          BookingChannel.AIRBNB,
      });

    expect(booking).toMatchObject({
      provider:
        INTEGRATION_PROVIDERS.ICAL,

      channel:
        BookingChannel.AIRBNB,

      externalBookingId:
        "reservation-123@example.com",

      externalPropertyId:
        "property-airbnb-123",

      status:
        EXTERNAL_BOOKING_STATUSES.CONFIRMED,

      guest: {
        fullName:
          "Mario Rossi",
      },

      guests: 1,

      grossAmount: 0,

      currency: "EUR",
    });

    expect(
      booking.checkIn,
    ).toEqual(
      new Date(
        "2026-09-10T00:00:00.000Z",
      ),
    );

    expect(
      booking.checkOut,
    ).toEqual(
      new Date(
        "2026-09-13T00:00:00.000Z",
      ),
    );
  });

  it("mantiene separato il provider tecnico dal canale commerciale", () => {
    const booking =
      mapIcalEventToBooking({
        event:
          createEvent(),

        externalPropertyId:
          "booking-property-1",

        channel:
          BookingChannel.BOOKING,
      });

    expect(
      booking.provider,
    ).toBe(
      INTEGRATION_PROVIDERS.ICAL,
    );

    expect(
      booking.channel,
    ).toBe(
      BookingChannel.BOOKING,
    );
  });

  it("mappa STATUS:CANCELLED come prenotazione cancellata", () => {
    const booking =
      mapIcalEventToBooking({
        event:
          createEvent({
            status:
              "CANCELLED",
          }),

        externalPropertyId:
          "property-1",

        channel:
          BookingChannel.VRBO,
      });

    expect(
      booking.status,
    ).toBe(
      EXTERNAL_BOOKING_STATUSES.CANCELLED,
    );
  });

  it("usa un nome fallback quando SUMMARY è vuoto", () => {
    const booking =
      mapIcalEventToBooking({
        event:
          createEvent({
            summary: "   ",
          }),

        externalPropertyId:
          "property-1",

        channel:
          BookingChannel.OTHER,
      });

    expect(
      booking.guest.fullName,
    ).toBe(
      "Prenotazione iCal",
    );
  });

  it("rifiuta eventi senza UID valido", () => {
    expect(() =>
      mapIcalEventToBooking({
        event:
          createEvent({
            uid: "   ",
          }),

        externalPropertyId:
          "property-1",

        channel:
          BookingChannel.AIRBNB,
      }),
    ).toThrow(
      "L'evento iCal non contiene un UID valido.",
    );
  });

  it("rifiuta externalPropertyId vuoto", () => {
    expect(() =>
      mapIcalEventToBooking({
        event:
          createEvent(),

        externalPropertyId:
          "   ",

        channel:
          BookingChannel.AIRBNB,
      }),
    ).toThrow(
      "La connessione iCal non contiene un externalPropertyId valido.",
    );
  });

  it("rifiuta un check-out precedente o uguale al check-in", () => {
    expect(() =>
      mapIcalEventToBooking({
        event:
          createEvent({
            start:
              new Date(
                "2026-09-13T00:00:00.000Z",
              ),

            end:
              new Date(
                "2026-09-13T00:00:00.000Z",
              ),
          }),

        externalPropertyId:
          "property-1",

        channel:
          BookingChannel.BOOKING,
      }),
    ).toThrow(
      'L\'evento iCal "reservation-123@example.com" contiene un check-out non successivo al check-in.',
    );
  });

  it("preserva i metadati iCal nel rawPayload", () => {
    const booking =
      mapIcalEventToBooking({
        event:
          createEvent({
            description:
              "Imported from external calendar",

            location:
              "Milano",
          }),

        externalPropertyId:
          "property-1",

        channel:
          BookingChannel.BOOKING,
      });

    expect(
      booking.rawPayload,
    ).toEqual({
      uid:
        "reservation-123@example.com",

      summary:
        "Mario Rossi",

      start:
        "2026-09-10T00:00:00.000Z",

      end:
        "2026-09-13T00:00:00.000Z",

      status:
        "CONFIRMED",

      description:
        "Imported from external calendar",

      location:
        "Milano",

      isAllDay: true,
    });
  });
});

function createEvent(
  overrides:
    Partial<IcalBookingEvent> = {},
): IcalBookingEvent {
  return {
    uid:
      "reservation-123@example.com",

    summary:
      "Mario Rossi",

    start:
      new Date(
        "2026-09-10T00:00:00.000Z",
      ),

    end:
      new Date(
        "2026-09-13T00:00:00.000Z",
      ),

    status:
      "CONFIRMED",

    description:
      undefined,

    location:
      undefined,

    isAllDay:
      true,

    ...overrides,
  };
}