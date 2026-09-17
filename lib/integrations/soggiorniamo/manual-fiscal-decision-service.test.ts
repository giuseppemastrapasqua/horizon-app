import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  persistManualFiscalDecision,
} from "./manual-fiscal-decision-service";

function repository() {
  return {
    upsert: vi.fn().mockResolvedValue({}),
  };
}

describe(
  "manual fiscal decision service",
  () => {
    it(
      "calcola code 1 con tariffa Milano e massimo 14 notti",
      async () => {
        const repo = repository();

        const result =
          await persistManualFiscalDecision(
            {
              bookingGuestId: "guest-1",
              checkIn: new Date(
                "2026-09-01T00:00:00.000Z",
              ),
              checkOut: new Date(
                "2026-09-21T00:00:00.000Z",
              ),
              guestTypeCode: 1,
            },
            repo,
          );

        expect(result).toMatchObject({
          bookingGuestId: "guest-1",
          guestTypeCode: 1,
          tariff: 9.5,
          taxAmount: 133,
          intermediary: null,
          source: "MANUAL",
          status: "CLASSIFIED",
          reason: "MANUAL_ORDINARY_RATE",
        });

        expect(repo.upsert).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      "non deduce gli importi di code 14",
      async () => {
        const repo = repository();

        await expect(
          persistManualFiscalDecision(
            {
              bookingGuestId: "guest-14",
              checkIn: new Date(
                "2026-09-01T00:00:00.000Z",
              ),
              checkOut: new Date(
                "2026-09-04T00:00:00.000Z",
              ),
              guestTypeCode: 14,
              intermediary: "PORTALE",
            },
            repo,
          ),
        ).rejects.toThrow(
          "Explicit tariff and taxAmount are required for this fiscal classification.",
        );

        expect(repo.upsert).not.toHaveBeenCalled();
      },
    );

    it(
      "salva code 14 solo con valori espliciti",
      async () => {
        const repo = repository();

        const result =
          await persistManualFiscalDecision(
            {
              bookingGuestId: "guest-14",
              checkIn: new Date(
                "2026-09-01T00:00:00.000Z",
              ),
              checkOut: new Date(
                "2026-09-04T00:00:00.000Z",
              ),
              guestTypeCode: 14,
              intermediary: "Portale",
              tariff: 9.5,
              taxAmount: 28.5,
            },
            repo,
          );

        expect(result).toMatchObject({
          guestTypeCode: 14,
          tariff: 9.5,
          taxAmount: 28.5,
          intermediary: "Portale",
          source: "MANUAL",
          status: "CLASSIFIED",
        });
      },
    );

    it(
      "richiede importi espliciti per altre esenzioni",
      async () => {
        const repo = repository();

        const result =
          await persistManualFiscalDecision(
            {
              bookingGuestId: "guest-9",
              checkIn: new Date(
                "2026-09-01T00:00:00.000Z",
              ),
              checkOut: new Date(
                "2026-09-04T00:00:00.000Z",
              ),
              guestTypeCode: 9,
              tariff: 0,
              taxAmount: 0,
            },
            repo,
          );

        expect(result).toMatchObject({
          guestTypeCode: 9,
          tariff: 0,
          taxAmount: 0,
          source: "MANUAL",
          status: "CLASSIFIED",
          reason:
            "MANUAL_FISCAL_CLASSIFICATION",
        });
      },
    );

    it(
      "rifiuta importi negativi",
      async () => {
        const repo = repository();

        await expect(
          persistManualFiscalDecision(
            {
              bookingGuestId: "guest-x",
              checkIn: new Date(
                "2026-09-01T00:00:00.000Z",
              ),
              checkOut: new Date(
                "2026-09-04T00:00:00.000Z",
              ),
              guestTypeCode: 9,
              tariff: 0,
              taxAmount: -1,
            },
            repo,
          ),
        ).rejects.toThrow(
          "Tariff and taxAmount must be non-negative finite numbers.",
        );
      },
    );
  },
);
