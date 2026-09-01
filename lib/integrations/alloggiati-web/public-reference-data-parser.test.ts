import {
  describe,
  expect,
  it,
} from "vitest";

import {
  parsePublicAlloggiatiReferenceData,
} from "./public-reference-data-parser";

describe(
  "parsePublicAlloggiatiReferenceData",
  () => {
    const municipalities = [
      "Codice,Descrizione,Provincia,DataFineVal",
      "M001,Comune Attivo,MI,",
      "M002,Comune Storico,TO,31/12/1983 00:00:00",
    ].join("\r\n");

    const countries = [
      "Codice,Descrizione,Provincia,DataFineVal",
      "100000100,ITALIA,ES,",
      "S001,Stato Estero,ES,",
      "S002,Stato Storico,ES,01/01/2000 00:00:00",
    ].join("\r\n");

    const documents = [
      "Codice,Descrizione",
      "D001,Documento Test",
      "D002,Documento Secondario",
    ].join("\r\n");

    it(
      "mappa i riferimenti attivi",
      () => {
        const result =
          parsePublicAlloggiatiReferenceData(
            municipalities,
            countries,
            documents,
          );

        expect(result.municipalities).toEqual([
          {
            code: "M001",
            name: "Comune Attivo",
            province: "MI",
          },
        ]);

        expect(result.countries).toHaveLength(2);
        expect(result.documentTypes).toHaveLength(2);
      },
    );

    it(
      "identifica Italia tramite il codice ufficiale",
      () => {
        const result =
          parsePublicAlloggiatiReferenceData(
            municipalities,
            countries,
            documents,
          );

        expect(
          result.countries.find(
            (item) =>
              item.code === "100000100",
          ),
        ).toEqual({
          code: "100000100",
          name: "ITALIA",
          isItaly: true,
        });

        expect(
          result.countries.find(
            (item) => item.code === "S001",
          )?.isItaly,
        ).toBe(false);
      },
    );

    it(
      "esclude comuni e stati cessati",
      () => {
        const result =
          parsePublicAlloggiatiReferenceData(
            municipalities,
            countries,
            documents,
          );

        expect(
          result.municipalities.some(
            (item) => item.code === "M002",
          ),
        ).toBe(false);

        expect(
          result.countries.some(
            (item) => item.code === "S002",
          ),
        ).toBe(false);
      },
    );

    it(
      "blocca header inattesi",
      () => {
        expect(() =>
          parsePublicAlloggiatiReferenceData(
            "Codice,Nome`nM001,Milano",
            countries,
            documents,
          ),
        ).toThrow(
          "Header tabella pubblica Alloggiati non valido.",
        );
      },
    );

    it(
      "blocca righe con colonne errate",
      () => {
        expect(() =>
          parsePublicAlloggiatiReferenceData(
            [
              "Codice,Descrizione,Provincia,DataFineVal",
              "M001,Milano,MI",
            ].join("\r\n"),
            countries,
            documents,
          ),
        ).toThrow(
          "Riga tabella pubblica Alloggiati non valida: 2.",
        );
      },
    );
  },
);
