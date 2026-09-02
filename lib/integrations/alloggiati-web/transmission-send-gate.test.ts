import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  authorizeAlloggiatiTransmissionSend,
} from "./transmission-send-gate";

describe(
  "authorizeAlloggiatiTransmissionSend",
  () => {
    it(
      "autorizza solo se PREPARED passa atomicamente a SENDING",
      async () => {
        const beginSending = vi.fn(
          async () => true,
        );

        await expect(
          authorizeAlloggiatiTransmissionSend(
            "transmission-1",
            { beginSending },
          ),
        ).resolves.toBeUndefined();

        expect(
          beginSending,
        ).toHaveBeenCalledWith(
          "transmission-1",
        );
      },
    );

    it(
      "blocca se la transmission non e piu PREPARED",
      async () => {
        const beginSending = vi.fn(
          async () => false,
        );

        await expect(
          authorizeAlloggiatiTransmissionSend(
            "transmission-1",
            { beginSending },
          ),
        ).rejects.toThrow(
          "Transmission Alloggiati Web non autorizzata all'invio.",
        );

        expect(
          beginSending,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      "rifiuta un id vuoto senza interrogare lo store",
      async () => {
        const beginSending = vi.fn(
          async () => true,
        );

        await expect(
          authorizeAlloggiatiTransmissionSend(
            "   ",
            { beginSending },
          ),
        ).rejects.toThrow(
          "Transmission Alloggiati Web non valida.",
        );

        expect(
          beginSending,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      "normalizza l'id prima del compare-and-set",
      async () => {
        const beginSending = vi.fn(
          async () => true,
        );

        await authorizeAlloggiatiTransmissionSend(
          " transmission-1 ",
          { beginSending },
        );

        expect(
          beginSending,
        ).toHaveBeenCalledWith(
          "transmission-1",
        );
      },
    );
  },
);