import { describe, expect, it } from "vitest";

import type { Ross1000Movements } from "./movement-types";
import { buildRoss1000Xml } from "./xml-builder";

describe("buildRoss1000Xml", () => {
  it("serializes a complete movement in the official element order", () => {
    const input: Ross1000Movements = {
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
              canalePrenotazione: "Diretta web",
            },
          ],
          partenze: [
            {
              idswh: "GUEST-2",
              tipoAlloggiato: "18",
              arrivo: "20260924",
            },
          ],
          prenotazioni: [
            {
              idswh: "BOOKING-1",
              arrivo: "20261001",
              partenza: "20261003",
              ospiti: 2,
              camere: 1,
              prezzo: 63,
              canalePrenotazione: "Diretta web",
              statoProvenienza: "100000100",
              comuneProvenienza: "403015146",
            },
          ],
          rettifiche: {
            eliminazioni: [
              {
                idswh: "OLD-GUEST",
                tipoAlloggiato: "18",
                arrivo: "20260920",
              },
            ],
            cancellazioni: [
              {
                idswh: "OLD-BOOKING",
                arrivo: "20261005",
              },
            ],
            conferme: [
              {
                idswh: "BOOKING-2",
                arrivo: "20261006",
              },
            ],
          },
        },
      ],
    };

    const xml = buildRoss1000Xml(input);

    expect(xml).toContain(
      '<?xml version="1.0" encoding="UTF-8"?>',
    );
    expect(xml).toContain("<codice>A00000</codice>");
    expect(xml).toContain("<prodotto>Horizon</prodotto>");
    expect(xml).toContain("<data>20260926</data>");
    expect(xml).toContain("<apertura>SI</apertura>");
    expect(xml).toContain("<camereoccupate>1</camereoccupate>");
    expect(xml).toContain(
      "<cameredisponibili>2</cameredisponibili>",
    );
    expect(xml).toContain("<lettidisponibili>4</lettidisponibili>");
    expect(xml).toContain("<idswh>GUEST-1</idswh>");
    expect(xml).toContain("<tipoturismo>Culturale</tipoturismo>");
    expect(xml).toContain("<mezzotrasporto>Auto</mezzotrasporto>");
    expect(xml).toContain("<prezzo>63.00</prezzo>");
    expect(xml).toContain("<rettifiche>");
    expect(xml).toContain("<eliminazione>");
    expect(xml).toContain("<cancellazione>");
    expect(xml).toContain("<conferma>");

    expect(xml.indexOf("<arrivi>")).toBeLessThan(
      xml.indexOf("<partenze>"),
    );
    expect(xml.indexOf("<partenze>")).toBeLessThan(
      xml.indexOf("<prenotazioni>"),
    );
    expect(xml.indexOf("<prenotazioni>")).toBeLessThan(
      xml.indexOf("<rettifiche>"),
    );
  });

  it("escapes XML-sensitive values", () => {
    const xml = buildRoss1000Xml({
      codice: "A&1",
      prodotto: 'Horizon <10> "test"',
      movimenti: [
        {
          data: "20260926",
          struttura: {
            apertura: "SI",
            camereOccupate: 0,
            camereDisponibili: 1,
            lettiDisponibili: 2,
          },
        },
      ],
    });

    expect(xml).toContain("<codice>A&amp;1</codice>");
    expect(xml).toContain(
      "<prodotto>Horizon &lt;10&gt; &quot;test&quot;</prodotto>",
    );
  });

  it("omits optional empty movement containers", () => {
    const xml = buildRoss1000Xml({
      codice: "A00000",
      prodotto: "Horizon",
      movimenti: [
        {
          data: "20260926",
          struttura: {
            apertura: "SI",
            camereOccupate: 0,
            camereDisponibili: 1,
            lettiDisponibili: 2,
          },
          arrivi: [],
          partenze: [],
          prenotazioni: [],
          rettifiche: {},
        },
      ],
    });

    expect(xml).not.toContain("<arrivi>");
    expect(xml).not.toContain("<partenze>");
    expect(xml).not.toContain("<prenotazioni>");
    expect(xml).not.toContain("<rettifiche>");
  });

  it("rejects invalid payloads before serialization", () => {
    const input: Ross1000Movements = {
      codice: "A00000",
      prodotto: "Horizon",
      movimenti: [],
    };

    expect(() => buildRoss1000Xml(input)).toThrow();
  });
});


