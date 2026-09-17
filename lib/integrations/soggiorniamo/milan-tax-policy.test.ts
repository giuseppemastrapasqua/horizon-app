import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateMilanShortRentalTax,
  resolveMilanShortRentalTaxPolicy,
} from "./milan-tax-policy";

describe(
  "Milan short-rental tourist-tax policy",
  () => {
    it(
      "usa €9,50 anche nel periodo gennaio-marzo 2026",
      () => {
        expect(
          resolveMilanShortRentalTaxPolicy(
            new Date(
              "2026-02-10T00:00:00.000Z",
            ),
          ),
        ).toMatchObject({
          municipalityCode: "F205",
          nightlyRate: 9.5,
          maximumTaxableNights: 14,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-03-31",
        });
      },
    );

    it(
      "usa €9,50 dal 1 aprile 2026",
      () => {
        expect(
          resolveMilanShortRentalTaxPolicy(
            new Date(
              "2026-04-01T00:00:00.000Z",
            ),
          ),
        ).toMatchObject({
          nightlyRate: 9.5,
          maximumTaxableNights: 14,
          effectiveFrom: "2026-04-01",
          effectiveTo: "2026-12-31",
        });
      },
    );

    it(
      "calcola l'adulto ordinario",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: 3,
            guestTypeCode: 1,
          }),
        ).toEqual({
          status: "CALCULATED",
          guestTypeCode: 1,
          tariff: 9.5,
          taxableNights: 3,
          taxAmount: 28.5,
          reason: "ORDINARY_RATE",
        });
      },
    );

    it(
      "limita l'imposta a 14 notti consecutive",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-07-01T00:00:00.000Z",
            ),
            nights: 20,
            guestTypeCode: 1,
          }),
        ).toEqual({
          status: "CALCULATED",
          guestTypeCode: 1,
          tariff: 9.5,
          taxableNights: 14,
          taxAmount: 133,
          reason: "ORDINARY_RATE",
        });
      },
    );

    it(
      "azzera il minore code 2",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: 4,
            guestTypeCode: 2,
          }),
        ).toEqual({
          status: "CALCULATED",
          guestTypeCode: 2,
          tariff: 0,
          taxableNights: 0,
          taxAmount: 0,
          reason: "MINOR_EXEMPT",
        });
      },
    );

    it(
      "azzera il residente Milano code 13",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: 4,
            guestTypeCode: 13,
          }),
        ).toEqual({
          status: "CALCULATED",
          guestTypeCode: 13,
          tariff: 0,
          taxableNights: 0,
          taxAmount: 0,
          reason:
            "MILAN_RESIDENT_EXCLUDED",
        });
      },
    );

    it(
      "non presume il trattamento fiscale dell'intermediario code 14",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: 4,
            guestTypeCode: 14,
          }),
        ).toEqual({
          status: "REVIEW_REQUIRED",
          guestTypeCode: 14,
          tariff: null,
          taxableNights: null,
          taxAmount: null,
          reason:
            "INTERMEDIARY_TAX_HANDLING_REQUIRED",
        });
      },
    );

    it(
      "non inventa il trattamento di altre esenzioni",
      () => {
        expect(
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: 4,
            guestTypeCode: 9,
          }),
        ).toEqual({
          status: "REVIEW_REQUIRED",
          guestTypeCode: 9,
          tariff: null,
          taxableNights: null,
          taxAmount: null,
          reason:
            "UNSUPPORTED_GUEST_TYPE",
        });
      },
    );

    it(
      "rifiuta anni senza policy configurata",
      () => {
        expect(() =>
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2027-01-01T00:00:00.000Z",
            ),
            nights: 2,
            guestTypeCode: 1,
          }),
        ).toThrow(
          "No Milan short-rental tourist-tax policy configured for 2027-01-01.",
        );
      },
    );

    it(
      "rifiuta un numero di notti negativo",
      () => {
        expect(() =>
          calculateMilanShortRentalTax({
            checkIn: new Date(
              "2026-09-16T00:00:00.000Z",
            ),
            nights: -1,
            guestTypeCode: 1,
          }),
        ).toThrow(
          "Nights must be a non-negative integer.",
        );
      },
    );
  },
);
