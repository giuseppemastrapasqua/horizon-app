import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAlloggiatiApartmentList,
} from "./apartment-list-parser";

describe(
  "parseAlloggiatiApartmentList",
  () => {
    it(
      "mappa ListaAppartamenti",
      () => {
        expect(
          parseAlloggiatiApartmentList(
            [
              "IdAppartamento;Descrizione",
              "123;Casa Centro",
              "456;Casa Mare",
            ].join("\r\n"),
          ),
        ).toEqual([
          {
            apartmentId: "123",
            description: "Casa Centro",
          },
          {
            apartmentId: "456",
            description: "Casa Mare",
          },
        ]);
      },
    );

    it(
      "decodifica newline XML numeriche",
      () => {
        expect(
          parseAlloggiatiApartmentList(
            "IdAppartamento;Descrizione&#13;&#10;123;Casa Centro",
          ),
        ).toEqual([
          {
            apartmentId: "123",
            description: "Casa Centro",
          },
        ]);
      },
    );

    it(
      "accetta header maiuscoli",
      () => {
        expect(
          parseAlloggiatiApartmentList(
            "IDAPPARTAMENTO;DESCRIZIONE\n123;Casa Centro",
          ),
        ).toEqual([
          {
            apartmentId: "123",
            description: "Casa Centro",
          },
        ]);
      },
    );

    it(
      "rifiuta IdAppartamento non numerico",
      () => {
        expect(
          () =>
            parseAlloggiatiApartmentList(
              "IdAppartamento;Descrizione\nAPT-123;Casa Centro",
            ),
        ).toThrow(
          "IdAppartamento non valido nella riga 2.",
        );
      },
    );

    it(
      "rifiuta descrizione mancante",
      () => {
        expect(
          () =>
            parseAlloggiatiApartmentList(
              "IdAppartamento;Descrizione\n123;",
            ),
        ).toThrow(
          "Descrizione appartamento mancante nella riga 2.",
        );
      },
    );

    it(
      "restituisce array vuoto per tabella vuota",
      () => {
        expect(
          parseAlloggiatiApartmentList(""),
        ).toEqual([]);
      },
    );
  },
);