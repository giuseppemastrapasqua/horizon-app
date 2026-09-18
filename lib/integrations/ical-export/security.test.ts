import {
  BookingChannel,
} from "@prisma/client";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  createIcalExportToken,
  verifyIcalExportToken,
} from "./security";

describe(
  "iCal export security",
  () => {
    const original =
      process.env.ICAL_EXPORT_SECRET;

    afterEach(() => {
      if (original === undefined) {
        delete process.env
          .ICAL_EXPORT_SECRET;
      } else {
        process.env
          .ICAL_EXPORT_SECRET =
          original;
      }
    });

    it(
      "firma property e destinazione",
      () => {
        process.env
          .ICAL_EXPORT_SECRET =
          "test-secret-only";

        const token =
          createIcalExportToken({
            propertyId:
              "property-1",

            destination:
              BookingChannel.BOOKING,
          });

        expect(
          verifyIcalExportToken({
            propertyId:
              "property-1",

            destination:
              BookingChannel.BOOKING,

            token,
          }),
        ).toBe(true);

        expect(
          verifyIcalExportToken({
            propertyId:
              "property-1",

            destination:
              BookingChannel.AIRBNB,

            token,
          }),
        ).toBe(false);
      },
    );
  },
);
