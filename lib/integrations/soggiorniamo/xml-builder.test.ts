import { describe, expect, it } from "vitest";

import type { SoggiorniamoXmlInput } from "./types";
import { buildSoggiorniamoXml } from "./xml-builder";

function validInput(): SoggiorniamoXmlInput {
  return {
    municipalityCode: "F205",
    authCode: "secret-test",
    userCode: "F205TEST",
    managerTaxCode: "TESTTAXCODE",
    managerLastName: "ROSSI",
    managerFirstName: "MARIO",
    insertType: 2 as const,
    structureId: "12541",
    structureName: "TEST PROPERTY",
    declaration: {
      year: 2026,
      period: 3,
      totalArrivals: 2,
      totalPayingPresences: 8,
      totalExemptGuests: 0,
      totalTax: 62.4,
      months: [
        {
          month: 9,
          guests: [
            {
              guestTypeCode: 1,
              checkIn: "2026-09-10",
              checkOut: "2026-09-14",
              arrivals: 2,
              presences: 8,
              unitId: "30267",
              residenceCountryCode: "100000100",
              residenceCityCode: "015146",
              tariff: 7.8,
              intermediary: "AIRBNB & TEST",
              taxAmount: 62.4,
            },
          ],
        },
      ],
    },
  };
}

describe("buildSoggiorniamoXml", () => {
  it("genera il nesting previsto dal template ufficiale", () => {
    const result = buildSoggiorniamoXml(validInput());

    expect(result).toContain("<dichiarazioni><comune>F205</comune>");
    expect(result).toContain("<utenti><utente>");
    expect(result).toContain("<auth>secret-test</auth>");
    expect(result).toContain("<codice_utente>F205TEST</codice_utente>");
    expect(result).toContain("<tipo_insert_dati>2</tipo_insert_dati>");
    expect(result).toContain("<strutture><struttura>");
    expect(result).toContain("<ID_struttura>12541</ID_struttura>");
    expect(result).toContain("<dic_anno>2026</dic_anno>");
    expect(result).toContain("<dic_periodo>3</dic_periodo>");
    expect(result).toContain("<mesi><mese><num_mese>9</num_mese>");
    expect(result).toContain("<ospiti><ospite>");
  });

  it("usa i nomi campo ufficiali e incassato=on", () => {
    const result = buildSoggiorniamoXml(validInput());

    expect(result).toContain("<ID_tipologia>1</ID_tipologia>");
    expect(result).toContain("<data_checkin>2026-09-10</data_checkin>");
    expect(result).toContain("<data_checkout>2026-09-14</data_checkout>");
    expect(result).toContain("<arrivi>2</arrivi>");
    expect(result).toContain("<presenze>8</presenze>");
    expect(result).toContain("<ID_unita>30267</ID_unita>");
    expect(result).toContain(
      "<statoResidenza>100000100</statoResidenza>",
    );
    expect(result).toContain("<cittaResidenza>015146</cittaResidenza>");
    expect(result).toContain("<tariffa>7.80</tariffa>");
    expect(result).toContain(
      "<intermediario>AIRBNB &amp; TEST</intermediario>",
    );
    expect(result).toContain("<incassato>on</incassato>");
    expect(result).toContain("<imposta>62.40</imposta>");
  });

  it("rifiuta tipo 2 senza check-in/check-out", () => {
    const input = validInput();
    input.declaration.months[0].guests[0].checkIn = undefined;

    expect(() => buildSoggiorniamoXml(input)).toThrow(
      "data check-in",
    );
  });

  it("rifiuta una dichiarazione senza mesi", () => {
    const input = validInput();
    input.declaration.months = [];

    expect(() => buildSoggiorniamoXml(input)).toThrow(
      "nessun mese",
    );
  });
});

