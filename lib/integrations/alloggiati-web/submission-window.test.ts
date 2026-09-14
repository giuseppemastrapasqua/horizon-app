import { describe, expect, it } from "vitest";

import { assertAlloggiatiSubmissionWindowOpen } from "./submission-window";

describe("assertAlloggiatiSubmissionWindowOpen", () => {
  it("blocca la verifica prima del giorno di check-in", () => {
    expect(() =>
      assertAlloggiatiSubmissionWindowOpen(
        new Date("2026-09-18T00:00:00.000Z"),
        new Date("2026-09-13T12:00:00.000Z"),
      ),
    ).toThrow(
      "Alloggiati Web sarà disponibile dal giorno del check-in.",
    );
  });

  it("consente verifica e invio il giorno del check-in", () => {
    expect(() =>
      assertAlloggiatiSubmissionWindowOpen(
        new Date("2026-09-18T00:00:00.000Z"),
        new Date("2026-09-18T10:00:00.000Z"),
      ),
    ).not.toThrow();
  });

  it("consente verifica e invio dopo il giorno del check-in", () => {
    expect(() =>
      assertAlloggiatiSubmissionWindowOpen(
        new Date("2026-09-18T00:00:00.000Z"),
        new Date("2026-09-19T10:00:00.000Z"),
      ),
    ).not.toThrow();
  });
});