import { describe, expect, it } from "vitest";

import type { Ross1000Movements } from "./movement-types";
import { validateRoss1000Movements } from "./movement-validator";

function validInput(): Ross1000Movements {
  return {
    codice: "A00000",
    prodotto: "Horizon",
    movimenti: [
      {
        data: "20260926",
        struttura: {
          apertura: "SI",
          camereOccupate: 1,
          camereDisponibili: 2,
          lettiDisponibili: 4,
        },
        arrivi: [
          {
            idswh: "GUEST-1",
            tipoAlloggiato: "18",
            sesso: "M",
            cittadinanza: "100000100",
            statoResidenza: "100000100",
            luogoResidenza: "403015146",
            dataNascita: "19900102",
            statoNascita: "100000100",
            comuneNascita: "403015146",
            tipoTurismo: "Culturale",
            mezzoTrasporto: "Auto",
          },
        ],
      },
    ],
  };
}

describe("validateRoss1000Movements", () => {
  it("accepts a valid movement", () => {
    expect(() =>
      validateRoss1000Movements(validInput()),
    ).not.toThrow();
  });

  it("rejects an impossible calendar date", () => {
    const input = validInput();
    input.movimenti[0].data = "20260230";

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow("ROSS1000: data movimento non valida.");
  });

  it("rejects movements not ordered by ascending date", () => {
    const input = validInput();
    input.movimenti.push({
      data: "20260925",
      struttura: {
        apertura: "SI",
        camereOccupate: 0,
        camereDisponibili: 2,
        lettiDisponibili: 4,
      },
    });

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: movimenti non ordinati per data crescente.",
    );
  });

  it("requires zero capacity values when closed", () => {
    const input = validInput();
    input.movimenti[0].struttura = {
      apertura: "NO",
      camereOccupate: 0,
      camereDisponibili: 2,
      lettiDisponibili: 4,
    };

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: struttura chiusa deve avere camere e letti a zero.",
    );
  });

  it("rejects idswh longer than 20 characters", () => {
    const input = validInput();
    input.movimenti[0].arrivi![0].idswh =
      "123456789012345678901";

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow("ROSS1000: idswh supera 20 caratteri.");
  });

  it.each(["19", "20"])(
    "requires idcapo for guest type %s",
    (guestType) => {
      const input = validInput();
      input.movimenti[0].arrivi![0].tipoAlloggiato =
        guestType;

      expect(() =>
        validateRoss1000Movements(input),
      ).toThrow(
        "ROSS1000: idcapo obbligatorio per componente famiglia/gruppo.",
      );
    },
  );

  it("requires residence municipality for Italian residents", () => {
    const input = validInput();
    input.movimenti[0].arrivi![0].luogoResidenza =
      undefined;

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: luogo residenza obbligatorio per residente in Italia.",
    );
  });

  it("requires birth municipality when birth state is Italy", () => {
    const input = validInput();
    input.movimenti[0].arrivi![0].comuneNascita =
      undefined;

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: comune nascita obbligatorio per nato in Italia.",
    );
  });

  it("rejects a birth municipality for foreign birth state", () => {
    const input = validInput();
    input.movimenti[0].arrivi![0].statoNascita =
      "100000200";

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: comune nascita deve essere vuoto per nato all'estero.",
    );
  });

  it("validates reservation counts and dates", () => {
    const input = validInput();
    input.movimenti[0].prenotazioni = [
      {
        idswh: "BOOKING-1",
        arrivo: "20261001",
        partenza: "20261003",
        ospiti: 0,
        camere: 1,
      },
    ];

    expect(() =>
      validateRoss1000Movements(input),
    ).toThrow(
      "ROSS1000: ospiti prenotazione non valido.",
    );
  });
});
