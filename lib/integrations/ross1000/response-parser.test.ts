import {
  describe,
  expect,
  it,
} from "vitest";
import {
  parseRoss1000Response,
} from "./response-parser";

describe("parseRoss1000Response", () => {
  it("parses WSDL V2 day results", () => {
    const result =
      parseRoss1000Response(`
        <return>
          <risultatiGiorno data="20260929">
            <arrivi>
              <arrivo>
                <idswh>H001</idswh>
                <successo>true</successo>
              </arrivo>
            </arrivi>
            <partenze>
              <partenza>
                <idswh>H002</idswh>
                <successo>1</successo>
              </partenza>
            </partenze>
          </risultatiGiorno>
        </return>
      `);

    expect(result).toEqual({
      days: [
        {
          date: "20260929",
          results: [
            {
              kind: "arrival",
              idswh: "H001",
              success: true,
            },
            {
              kind: "departure",
              idswh: "H002",
              success: true,
            },
          ],
        },
      ],
      results: [
        {
          kind: "arrival",
          idswh: "H001",
          success: true,
        },
        {
          kind: "departure",
          idswh: "H002",
          success: true,
        },
      ],
      allSuccessful: true,
    });
  });

  it("preserves rejected records", () => {
    const result =
      parseRoss1000Response(`
        <return>
          <risultatiGiorno data="20260929">
            <arrivi>
              <arrivo>
                <idswh>H001</idswh>
                <successo>false</successo>
                <errore>Dati &amp; codice non validi</errore>
              </arrivo>
            </arrivi>
          </risultatiGiorno>
        </return>
      `);

    expect(
      result.allSuccessful,
    ).toBe(false);

    expect(result.results).toEqual([
      {
        kind: "arrival",
        idswh: "H001",
        success: false,
        error:
          "Dati & codice non validi",
      },
    ]);
  });

  it("parses reservation and correction results", () => {
    const result =
      parseRoss1000Response(`
        <return>
          <risultatiGiorno data="20260929">
            <prenotazioni>
              <prenotazione>
                <idswh>R001</idswh>
                <successo>true</successo>
              </prenotazione>
            </prenotazioni>
            <retifiche>
              <eliminazione>
                <idswh>H009</idswh>
                <successo>true</successo>
              </eliminazione>
            </retifiche>
          </risultatiGiorno>
        </return>
      `);

    expect(
      result.results.map(
        (item) => item.kind,
      ),
    ).toEqual([
      "reservation",
      "correction",
    ]);

    expect(
      result.allSuccessful,
    ).toBe(true);
  });

  it("does not treat an empty day as automatic success", () => {
    const result =
      parseRoss1000Response(`
        <return>
          <risultatiGiorno data="20260929">
          </risultatiGiorno>
        </return>
      `);

    expect(result).toEqual({
      days: [
        {
          date: "20260929",
          results: [],
        },
      ],
      results: [],
      allSuccessful: null,
    });
  });

  it("rejects malformed record results", () => {
    expect(() =>
      parseRoss1000Response(`
        <risultatiGiorno>
          <arrivi>
            <arrivo>
              <successo>true</successo>
            </arrivo>
          </arrivi>
        </risultatiGiorno>
      `),
    ).toThrow(
      "Risposta ROSS1000 con risultato senza idswh.",
    );

    expect(() =>
      parseRoss1000Response(`
        <risultatiGiorno>
          <arrivi>
            <arrivo>
              <idswh>H001</idswh>
              <successo>maybe</successo>
            </arrivo>
          </arrivi>
        </risultatiGiorno>
      `),
    ).toThrow(
      "Risposta ROSS1000 con successo non valido per H001.",
    );
  });

  it("rejects an empty response", () => {
    expect(() =>
      parseRoss1000Response(" "),
    ).toThrow(
      "Risposta ROSS1000 vuota.",
    );
  });
});
