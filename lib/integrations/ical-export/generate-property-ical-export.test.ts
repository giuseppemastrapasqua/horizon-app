import {
  BookingChannel,
  BookingStatus,
} from "@prisma/client";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const findUniqueMock =
  vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique:
        findUniqueMock,
    },
  },
}));

import {
  generatePropertyIcalExport,
} from "./generate-property-ical-export";

describe(
  "generatePropertyIcalExport",
  () => {
    beforeEach(() => {
      findUniqueMock.mockReset();
    });

    it(
      "genera un calendario senza dati personali",
      async () => {
        findUniqueMock.mockResolvedValue({
          id: "property-1",
          name: "Test Apartment",

          bookings: [
            {
              id: "booking-1",

              checkIn:
                new Date(
                  "2026-10-10T14:00:00.000Z",
                ),

              checkOut:
                new Date(
                  "2026-10-13T10:00:00.000Z",
                ),

              channel:
                BookingChannel.DIRECT,
            },
          ],

          availabilityBlocks: [
            {
              id: "block-1",

              startDate:
                new Date(
                  "2026-10-20T00:00:00.000Z",
                ),

              endDate:
                new Date(
                  "2026-10-22T00:00:00.000Z",
                ),

              source:
                "MANUAL",
            },
          ],
        });

        const result =
          await generatePropertyIcalExport({
            propertyId:
              "property-1",

            destination:
              BookingChannel.BOOKING,
          });

        expect(result).toContain(
          "BEGIN:VCALENDAR",
        );

        expect(result).toContain(
          "DTSTART;VALUE=DATE:20261010",
        );

        expect(result).toContain(
          "DTEND;VALUE=DATE:20261013",
        );

        expect(result).toContain(
          "horizon-block-block-1@horizon",
        );

        expect(result).not.toContain(
          "guest",
        );
      },
    );

    it(
      "esclude il canale destinatario nella query",
      async () => {
        findUniqueMock.mockResolvedValue({
          id: "property-1",
          name: "Test",
          bookings: [],
          availabilityBlocks: [],
        });

        await generatePropertyIcalExport({
          propertyId:
            "property-1",

          destination:
            BookingChannel.AIRBNB,
        });

        expect(
          findUniqueMock,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            select:
              expect.objectContaining({
                bookings:
                  expect.objectContaining({
                    where:
                      expect.objectContaining({
                        bookingStatus: {
                          in: [
                            BookingStatus.PENDING,
                            BookingStatus.CONFIRMED,
                            BookingStatus.CHECKED_IN,
                          ],
                        },

                        channel: {
                          not:
                            BookingChannel.AIRBNB,
                        },
                      }),
                  }),
              }),
          }),
        );
      },
    );
  },
);
