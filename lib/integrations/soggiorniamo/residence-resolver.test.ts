import { describe, expect, it } from "vitest";

import { resolveSoggiorniamoResidence } from "./residence-resolver";

describe("Soggiorniamo residence resolver", () => {
  it("risolve Italia con codice paese 100", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: "ITALIA",
        city: "ROMA",
        province: "RM",
      }),
    ).toEqual({
      countryCode: "100",
    });
  });

  it("risolve Milano MI con Belfiore F205", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: "ITALIA",
        city: "MILANO",
        province: "MI",
      }),
    ).toEqual({
      countryCode: "100",
      municipalityCode: "F205",
    });
  });

  it("normalizza maiuscole, spazi e accenti", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: "  Italia ",
        city: " Milano ",
        province: " mi ",
      }),
    ).toEqual({
      countryCode: "100",
      municipalityCode: "F205",
    });
  });

  it("non considera Milano senza provincia coerente", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: "ITALIA",
        city: "MILANO",
        province: "RM",
      }),
    ).toEqual({
      countryCode: "100",
    });
  });

  it("non inventa codici per paesi non ancora mappati", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: "FRANCIA",
        city: "PARIGI",
        province: null,
      }),
    ).toBeUndefined();
  });

  it("non risolve una residenza assente", () => {
    expect(
      resolveSoggiorniamoResidence({
        country: null,
        city: null,
        province: null,
      }),
    ).toBeUndefined();
  });
});
