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
    const originalIcalSecret =
      process.env.ICAL_EXPORT_SECRET;
    const originalCronSecret =
      process.env.CRON_SECRET;
    const originalBackgroundJobSecret =
      process.env.BACKGROUND_JOB_SECRET;

    afterEach(() => {
      restoreEnv(
        "ICAL_EXPORT_SECRET",
        originalIcalSecret,
      );
      restoreEnv(
        "CRON_SECRET",
        originalCronSecret,
      );
      restoreEnv(
        "BACKGROUND_JOB_SECRET",
        originalBackgroundJobSecret,
      );
    });

    it(
      "firma property e destinazione",
      () => {
        process.env.ICAL_EXPORT_SECRET =
          "test-secret-only";

        const token =
          createIcalExportToken({
            propertyId: "property-1",
            destination:
              BookingChannel.BOOKING,
          });

        expect(
          verifyIcalExportToken({
            propertyId: "property-1",
            destination:
              BookingChannel.BOOKING,
            token,
          }),
        ).toBe(true);

        expect(
          verifyIcalExportToken({
            propertyId: "property-1",
            destination:
              BookingChannel.AIRBNB,
            token,
          }),
        ).toBe(false);
      },
    );

    it(
      "richiede ICAL_EXPORT_SECRET senza fallback su altri secret",
      () => {
        delete process.env.ICAL_EXPORT_SECRET;

        process.env.CRON_SECRET =
          "cron-secret";
        process.env.BACKGROUND_JOB_SECRET =
          "background-job-secret";

        expect(() =>
          createIcalExportToken({
            propertyId: "property-1",
            destination:
              BookingChannel.BOOKING,
          }),
        ).toThrow(
          "ICAL_EXPORT_SECRET non configurato.",
        );
      },
    );
  },
);

function restoreEnv(
  key:
    | "ICAL_EXPORT_SECRET"
    | "CRON_SECRET"
    | "BACKGROUND_JOB_SECRET",
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
