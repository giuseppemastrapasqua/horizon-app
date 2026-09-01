import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parseAlloggiatiTableCsv,
} from "./table-csv-parser";

describe(
  "parseAlloggiatiTableCsv",
  () => {
    it(
      "legge un CSV separato da punto e virgola",
      () => {
        const rows =
          parseAlloggiatiTableCsv(
            [
              "CODICE;DESCRIZIONE",
              "001;Primo valore",
              "002;Secondo valore",
            ].join("\r\n"),
          );

        expect(rows).toEqual([
          {
            CODICE: "001",
            DESCRIZIONE: "Primo valore",
          },
          {
            CODICE: "002",
            DESCRIZIONE: "Secondo valore",
          },
        ]);
      },
    );

    it(
      "supporta newline LF",
      () => {
        const rows =
          parseAlloggiatiTableCsv(
            "A;B\n1;2\n",
          );

        expect(rows).toEqual([
          {
            A: "1",
            B: "2",
          },
        ]);
      },
    );

    it(
      "restituisce array vuoto per CSV vuoto",
      () => {
        expect(
          parseAlloggiatiTableCsv(""),
        ).toEqual([]);
      },
    );

    it(
      "rifiuta righe con numero colonne errato",
      () => {
        expect(
          () =>
            parseAlloggiatiTableCsv(
              "A;B\n1",
            ),
        ).toThrow(
          "Riga CSV Alloggiati non valida: 2.",
        );
      },
    );

    it(
      "rifiuta header vuoti",
      () => {
        expect(
          () =>
            parseAlloggiatiTableCsv(
              "A;;B\n1;2;3",
            ),
        ).toThrow(
          "Header CSV Alloggiati non valido.",
        );
      },
    );
  },
);
