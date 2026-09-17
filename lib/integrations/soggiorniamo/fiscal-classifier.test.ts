import { describe, expect, it } from "vitest";

import {
  ageAtCheckIn,
  classifySoggiorniamoGuest,
} from "./fiscal-classifier";

describe("Soggiorniamo fiscal classifier", () => {
  it("calcola l'età alla data di check-in", () => {
    expect(
      ageAtCheckIn(
        new Date("2008-09-17T00:00:00.000Z"),
        new Date("2026-09-16T00:00:00.000Z"),
      ),
    ).toBe(17);

    expect(
      ageAtCheckIn(
        new Date("2008-09-16T00:00:00.000Z"),
        new Date("2026-09-16T00:00:00.000Z"),
      ),
    ).toBe(18);
  });

  it("classifica automaticamente un minore con codice 2", () => {
    expect(
      classifySoggiorniamoGuest({
        guest: {
          guestId: "guest-1",
          birthDate: new Date("2010-01-01T00:00:00.000Z"),
        },
        checkIn: new Date("2026-09-16T00:00:00.000Z"),
      }),
    ).toEqual({
      status: "CLASSIFIED",
      source: "AUTO",
      guestTypeCode: 2,
      reason: "MINOR_UNDER_18",
    });
  });

  it("classifica residente Milano solo da residenza già risolta", () => {
    expect(
      classifySoggiorniamoGuest({
        guest: {
          guestId: "guest-2",
          birthDate: new Date("1980-01-01T00:00:00.000Z"),
        },
        checkIn: new Date("2026-09-16T00:00:00.000Z"),
        residence: {
          countryCode: "100",
          municipalityCode: "F205",
        },
      }),
    ).toEqual({
      status: "CLASSIFIED",
      source: "AUTO",
      guestTypeCode: 13,
      reason: "MILAN_RESIDENT",
    });
  });

  it("non deduce automaticamente la categoria fiscale ordinaria", () => {
    expect(
      classifySoggiorniamoGuest({
        guest: {
          guestId: "guest-3",
          birthDate: new Date("1980-01-01T00:00:00.000Z"),
        },
        checkIn: new Date("2026-09-16T00:00:00.000Z"),
        residence: {
          countryCode: "100",
          municipalityCode: "H501",
        },
      }),
    ).toEqual({
      status: "REVIEW_REQUIRED",
      source: "AUTO",
      guestTypeCode: null,
      reason: "FISCAL_CLASSIFICATION_REQUIRED",
    });
  });

  it("non confonde cittadinanza e residenza", () => {
    expect(
      classifySoggiorniamoGuest({
        guest: {
          guestId: "guest-4",
          birthDate: new Date("1980-01-01T00:00:00.000Z"),
        },
        checkIn: new Date("2026-09-16T00:00:00.000Z"),
      }),
    ).toEqual({
      status: "REVIEW_REQUIRED",
      source: "AUTO",
      guestTypeCode: null,
      reason: "FISCAL_CLASSIFICATION_REQUIRED",
    });
  });
});
