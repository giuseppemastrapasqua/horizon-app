import {
  BookingChannel,
} from "@prisma/client";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const fetchIcalCalendarMock =
  vi.hoisted(() =>
    vi.fn(),
  );

vi.mock(
  "./fetch-ical-calendar",
  () => ({
    fetchIcalCalendar:
      fetchIcalCalendarMock,
  }),
);

import {
  INTEGRATION_PROVIDERS,
  PROVIDER_HEALTH_STATUSES,
} from "@/lib/integrations/shared/types";

import { IcalBookingClient } from "./ical-booking-client";

const ICAL_BODY = `
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Horizon//iCal Client Test//EN
BEGIN:VEVENT
UID:booking-001@example.com
DTSTAMP:20260811T070000Z
DTSTART;VALUE=DATE:20260910
DTEND;VALUE=DATE:20260913
SUMMARY:Mario Rossi
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
UID:booking-002@example.com
DTSTAMP:20260811T070000Z
DTSTART;VALUE=DATE:20260920
DTEND;VALUE=DATE:20260923
SUMMARY:Giulia Bianchi
STATUS:CANCELLED
END:VEVENT
END:VCALENDAR
`;

describe("IcalBookingClient", () => {
  beforeEach(() => {
    fetchIcalCalendarMock.mockReset();

    fetchIcalCalendarMock.mockResolvedValue(
      ICAL_BODY,
    );
  });

  it("usa ICAL come provider tecnico", () => {
    const client =
      createClient();

    expect(
      client.provider,
    ).toBe(
      INTEGRATION_PROVIDERS.ICAL,
    );
  });

  it("recupera tutte le prenotazioni dal feed", async () => {
    const client =
      createClient();

    const page =
      await client.fetchBookings();

    expect(
      page.bookings,
    ).toHaveLength(2);

    expect(
      page.hasMore,
    ).toBe(false);

    expect(
      page.bookings[0],
    ).toMatchObject({
      provider:
        INTEGRATION_PROVIDERS.ICAL,

      integrationConnectionId:
        "connection-ical-1",

      channel:
        BookingChannel.AIRBNB,

      externalBookingId:
        "booking-001@example.com",

      externalPropertyId:
        "airbnb-property-1",

      guest: {
        fullName:
          "Mario Rossi",
      },
    });
  });

  it("propaga integrationConnectionId a tutte le prenotazioni", async () => {
    const client =
      createClient();

    const page =
      await client.fetchBookings();

    expect(
      page.bookings,
    ).toHaveLength(2);

    expect(
      page.bookings.every(
        (booking) =>
          booking.integrationConnectionId ===
          "connection-ical-1",
      ),
    ).toBe(true);
  });

  it("recupera una prenotazione tramite UID", async () => {
    const client =
      createClient();

    const booking =
      await client.fetchBooking(
        "booking-002@example.com",
      );

    expect(
      booking,
    ).not.toBeNull();

    expect(
      booking?.externalBookingId,
    ).toBe(
      "booking-002@example.com",
    );

    expect(
      booking?.integrationConnectionId,
    ).toBe(
      "connection-ical-1",
    );
  });

  it("restituisce null per un UID inesistente", async () => {
    const client =
      createClient();

    const booking =
      await client.fetchBooking(
        "missing@example.com",
      );

    expect(
      booking,
    ).toBeNull();
  });

  it("filtra per externalPropertyId", async () => {
    const client =
      createClient();

    const matching =
      await client.fetchBookings({
        externalPropertyId:
          "airbnb-property-1",
      });

    expect(
      matching.bookings,
    ).toHaveLength(2);

    const nonMatching =
      await client.fetchBookings({
        externalPropertyId:
          "another-property",
      });

    expect(
      nonMatching.bookings,
    ).toEqual([]);
  });

  it("gestisce la paginazione con cursore", async () => {
    const client =
      createClient();

    const firstPage =
      await client.fetchBookings({
        limit: 1,
      });

    expect(
      firstPage.bookings,
    ).toHaveLength(1);

    expect(
      firstPage.hasMore,
    ).toBe(true);

    expect(
      firstPage.nextCursor,
    ).toBe("1");

    const secondPage =
      await client.fetchBookings({
        limit: 1,

        cursor:
          firstPage.nextCursor,
      });

    expect(
      secondPage.bookings,
    ).toHaveLength(1);

    expect(
      secondPage.hasMore,
    ).toBe(false);
  });

  it("rifiuta un cursore non valido", async () => {
    const client =
      createClient();

    await expect(
      client.fetchBookings({
        cursor:
          "invalid",
      }),
    ).rejects.toThrow(
      "Il cursore iCal non è valido.",
    );
  });

  it("rifiuta un limite non valido", async () => {
    const client =
      createClient();

    await expect(
      client.fetchBookings({
        limit:
          0,
      }),
    ).rejects.toThrow(
      "Il limite di paginazione iCal deve essere un intero positivo.",
    );
  });

  it("non supporta webhook", async () => {
    const client =
      createClient();

    await expect(
      client.verifyWebhook({
        headers:
          new Headers(),

        rawBody:
          "",
      }),
    ).rejects.toThrow(
      "Le integrazioni iCal non supportano webhook.",
    );
  });

  it("healthCheck è HEALTHY quando il feed è raggiungibile e valido", async () => {
    const client =
      createClient();

    const health =
      await client.healthCheck();

    expect(
      health.provider,
    ).toBe(
      INTEGRATION_PROVIDERS.ICAL,
    );

    expect(
      health.status,
    ).toBe(
      PROVIDER_HEALTH_STATUSES.HEALTHY,
    );
  });

  it("healthCheck è UNAVAILABLE quando il download fallisce", async () => {
    fetchIcalCalendarMock.mockRejectedValueOnce(
      new Error(
        "Feed non raggiungibile.",
      ),
    );

    const client =
      createClient();

    const health =
      await client.healthCheck();

    expect(
      health.status,
    ).toBe(
      PROVIDER_HEALTH_STATUSES.UNAVAILABLE,
    );

    expect(
      health.message,
    ).toBe(
      "Feed non raggiungibile.",
    );
  });

  it("rifiuta integrationConnectionId vuoto", () => {
    expect(
      () =>
        new IcalBookingClient({
          integrationConnectionId:
            "   ",

          feedUrl:
            "https://example.com/calendar.ics",

          externalPropertyId:
            "property-1",

          channel:
            BookingChannel.BOOKING,
        }),
    ).toThrow(
      "La configurazione iCal non contiene un integrationConnectionId valido.",
    );
  });

  it("rifiuta feedUrl vuoto", () => {
    expect(
      () =>
        new IcalBookingClient({
          integrationConnectionId:
            "connection-1",

          feedUrl:
            "   ",

          externalPropertyId:
            "property-1",

          channel:
            BookingChannel.BOOKING,
        }),
    ).toThrow(
      "La configurazione iCal non contiene un feedUrl valido.",
    );
  });

  it("rifiuta externalPropertyId vuoto", () => {
    expect(
      () =>
        new IcalBookingClient({
          integrationConnectionId:
            "connection-1",

          feedUrl:
            "https://example.com/calendar.ics",

          externalPropertyId:
            "   ",

          channel:
            BookingChannel.BOOKING,
        }),
    ).toThrow(
      "La configurazione iCal non contiene un externalPropertyId valido.",
    );
  });
});

function createClient() {
  return new IcalBookingClient({
    integrationConnectionId:
      "connection-ical-1",

    feedUrl:
      "https://calendar.example.com/feed.ics",

    externalPropertyId:
      "airbnb-property-1",

    channel:
      BookingChannel.AIRBNB,
  });
}