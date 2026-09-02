import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAlloggiatiSubmissionFingerprint,
} from "./submission-fingerprint";

describe(
  "createAlloggiatiSubmissionFingerprint",
  () => {
    const recordA = "A".repeat(168);
    const recordB = "B".repeat(168);

    it(
      "produce un hash SHA-256 deterministico",
      () => {
        const first =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [
              recordA,
              recordB,
            ],
          });

        const second =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [
              recordA,
              recordB,
            ],
          });

        expect(first).toBe(second);
        expect(first).toMatch(
          /^[a-f0-9]{64}$/,
        );
      },
    );

    it(
      "cambia se cambia una schedina",
      () => {
        const first =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [recordA],
          });

        const second =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [recordB],
          });

        expect(first).not.toBe(second);
      },
    );

    it(
      "cambia se cambia IdAppartamento",
      () => {
        const first =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [recordA],
          });

        const second =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "456",
            records: [recordA],
          });

        expect(first).not.toBe(second);
      },
    );

    it(
      "considera significativo l'ordine delle schedine",
      () => {
        const first =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [
              recordA,
              recordB,
            ],
          });

        const second =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [
              recordB,
              recordA,
            ],
          });

        expect(first).not.toBe(second);
      },
    );

    it(
      "normalizza gli spazi di IdAppartamento",
      () => {
        const first =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [recordA],
          });

        const second =
          createAlloggiatiSubmissionFingerprint({
            apartmentId: " 123 ",
            records: [recordA],
          });

        expect(first).toBe(second);
      },
    );

    it(
      "rifiuta IdAppartamento assente o non numerico",
      () => {
        expect(() =>
          createAlloggiatiSubmissionFingerprint({
            records: [recordA],
          }),
        ).toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );

        expect(() =>
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "APT-123",
            records: [recordA],
          }),
        ).toThrow(
          "IdAppartamento Alloggiati Web non valido.",
        );
      },
    );

    it(
      "rifiuta submission senza schedine",
      () => {
        expect(() =>
          createAlloggiatiSubmissionFingerprint({
            apartmentId: "123",
            records: [],
          }),
        ).toThrow(
          "Submission Alloggiati Web senza schedine.",
        );
      },
    );
  },
);
