import {
  describe,
  expect,
  it,
} from "vitest";

import {
  mapBookingToSoggiorniamoXmlInput,
} from "./booking-mapper";
import {
  buildSoggiorniamoXml,
} from "./xml-builder";

const config = {
  municipalityCode: "F205",
  authCode: "AUTH-TEST-NON-REALE",
  userCode: "F205TEST",
  managerTaxCode: "TESTTAXCODE",
  managerLastName: "ROSSI",
  managerFirstName: "MARIO",
  structureId: "12541",
  structureName: "TEST PROPERTY",
  unitId: "30267",
};

describe("mapBookingToSoggiorniamoXmlInput", () => {
  it("mappa una prenotazione puntuale", () => {
    const result =
      mapBookingToSoggiorniamoXmlInput(
        {
          bookingId: "booking-1",
          checkIn: new Date(
            "2026-09-10T00:00:00.000Z",
          ),
          checkOut: new Date(
            "2026-09-14T00:00:00.000Z",
          ),
          guests: [
            {
              id: "guest-1",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
              residenceCountryCode:
                "100000100",
              residenceCityCode: "015146",
            },
            {
              id: "guest-2",
              birthDate: new Date(
                "2012-01-01T00:00:00.000Z",
              ),
              residenceCountryCode:
                "100000100",
              residenceCityCode: "015146",
            },
          ],
          fiscalGuests: [
            {
              guestId: "guest-1",
              guestTypeCode: 1,
              tariff: 7.8,
              taxAmount: 31.2,
            },
            {
              guestId: "guest-2",
              guestTypeCode: 2,
              tariff: 0,
              taxAmount: 0,
            },
          ],
        },
        config,
      );

    expect(result.insertType).toBe(2);
    expect(result.declaration.year).toBe(2026);
    expect(result.declaration.period).toBe(3);
    expect(result.declaration.totalArrivals).toBe(2);
    expect(
      result.declaration.totalPayingPresences,
    ).toBe(4);
    expect(
      result.declaration.totalExemptGuests,
    ).toBe(1);
    expect(result.declaration.totalTax).toBe(
      31.2,
    );

    expect(
      result.declaration.months[0].guests,
    ).toHaveLength(2);

    expect(
      result.declaration.months[0].guests[0],
    ).toMatchObject({
      guestTypeCode: 1,
      arrivals: 1,
      presences: 4,
      checkIn: "2026-09-10",
      checkOut: "2026-09-14",
      unitId: "30267",
      residenceCityCode: "015146",
      tariff: 7.8,
      taxAmount: 31.2,
    });
  });

  it("non deduce automaticamente la categoria IDS", () => {
    expect(() =>
      mapBookingToSoggiorniamoXmlInput(
        {
          bookingId: "booking-1",
          checkIn: new Date(
            "2026-09-10T00:00:00.000Z",
          ),
          checkOut: new Date(
            "2026-09-11T00:00:00.000Z",
          ),
          guests: [
            {
              id: "guest-1",
              birthDate: new Date(
                "2012-01-01T00:00:00.000Z",
              ),
            },
          ],
          fiscalGuests: [],
        },
        config,
      ),
    ).toThrow(
      "classificazione IDS mancante",
    );
  });

  it("rifiuta classificazioni duplicate", () => {
    expect(() =>
      mapBookingToSoggiorniamoXmlInput(
        {
          bookingId: "booking-1",
          checkIn: new Date(
            "2026-09-10T00:00:00.000Z",
          ),
          checkOut: new Date(
            "2026-09-11T00:00:00.000Z",
          ),
          guests: [
            {
              id: "guest-1",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
            },
          ],
          fiscalGuests: [
            {
              guestId: "guest-1",
              guestTypeCode: 1,
              tariff: 7.8,
              taxAmount: 7.8,
            },
            {
              guestId: "guest-1",
              guestTypeCode: 2,
              tariff: 0,
              taxAmount: 0,
            },
          ],
        },
        config,
      ),
    ).toThrow(
      "classificazione IDS duplicata",
    );
  });

  it("produce XML valido dal risultato del mapper", () => {
    const mapped =
      mapBookingToSoggiorniamoXmlInput(
        {
          bookingId: "booking-xml",
          checkIn: new Date(
            "2026-09-10T00:00:00.000Z",
          ),
          checkOut: new Date(
            "2026-09-12T00:00:00.000Z",
          ),
          guests: [
            {
              id: "guest-1",
              birthDate: new Date(
                "1990-01-01T00:00:00.000Z",
              ),
              residenceCountryCode:
                "100000100",
              residenceCityCode: "015146",
            },
          ],
          fiscalGuests: [
            {
              guestId: "guest-1",
              guestTypeCode: 14,
              tariff: 7.8,
              intermediary: "AIRBNB",
              taxAmount: 15.6,
            },
          ],
        },
        config,
      );

    const xml = buildSoggiorniamoXml(mapped);

    expect(xml).toContain(
      "<ID_tipologia>14</ID_tipologia>",
    );
    expect(xml).toContain(
      "<intermediario>AIRBNB</intermediario>",
    );
    expect(xml).toContain(
      "<data_checkin>2026-09-10</data_checkin>",
    );
    expect(xml).toContain(
      "<imposta>15.60</imposta>",
    );
  });
});
