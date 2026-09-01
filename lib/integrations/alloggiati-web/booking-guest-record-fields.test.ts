import { describe, expect, it } from "vitest";

import { toAlloggiatiRecordFields } from "./booking-guest-record-fields";
import { MockAlloggiatiReferenceResolver } from "./mock-reference-resolver";
import { buildAlloggiatiRecord } from "./record-builder";

const resolver = new MockAlloggiatiReferenceResolver(
  {
    ITALIA: "IT-CODE",
    FRANCIA: "FR-CODE",
  },
  {
    "Milano|MI": "MI-CODE",
    Milano: "MI-CODE",
  },
  {
    CARTA_IDENTITA: "CI",
  },
);

const familyHead = {
  role: "FAMILY_HEAD" as const,
  firstName: "Mario",
  lastName: "Rossi",
  gender: "MALE" as const,
  birthDate: new Date("1980-01-02T00:00:00.000Z"),
  birthCity: "Milano",
  birthProvince: "MI",
  birthCountry: "ITALIA",
  citizenship: "ITALIA",
  documentType: "CARTA_IDENTITA",
  documentNumber: "AA1234567",
  documentIssueCountry: "ITALIA",
  documentIssueCity: "Milano",
};

describe("toAlloggiatiRecordFields", () => {
  it("mappa un capo famiglia italiano", async () => {
    const fields = await toAlloggiatiRecordFields(
      familyHead,
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 3,
      },
      resolver,
    );

    expect(fields).toEqual({
      guestType: "17",
      arrivalDate: "01/09/2026",
      stayDays: "03",
      lastName: "Rossi",
      firstName: "Mario",
      gender: "1",
      birthDate: "02/01/1980",
      birthCityCode: "MI-CODE",
      birthProvince: "MI",
      birthCountryCode: "IT-CODE",
      citizenshipCode: "IT-CODE",
      documentTypeCode: "CI",
      documentNumber: "AA1234567",
      documentIssuePlaceCode: "MI-CODE",
    });
  });

  it("lascia vuoto il documento per un familiare", async () => {
    const fields = await toAlloggiatiRecordFields(
      {
        ...familyHead,
        role: "FAMILY_MEMBER",
        documentType: null,
        documentNumber: null,
        documentIssueCountry: null,
        documentIssueCity: null,
      },
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 2,
      },
      resolver,
    );

    expect(fields.guestType).toBe("19");
    expect(fields.documentTypeCode).toBe("");
    expect(fields.documentNumber).toBe("");
    expect(fields.documentIssuePlaceCode).toBe("");
  });

  it("mappa una nascita estera senza comune e provincia", async () => {
    const fields = await toAlloggiatiRecordFields(
      {
        ...familyHead,
        birthCity: null,
        birthProvince: null,
        birthCountry: "FRANCIA",
        citizenship: "FRANCIA",
      },
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 1,
      },
      resolver,
    );

    expect(fields.birthCityCode).toBe("");
    expect(fields.birthProvince).toBe("");
    expect(fields.birthCountryCode).toBe("FR-CODE");
    expect(fields.citizenshipCode).toBe("FR-CODE");
  });

  it("rifiuta una permanenza superiore a 30 giorni", async () => {
    await expect(
      toAlloggiatiRecordFields(
        familyHead,
        {
          checkIn: new Date("2026-09-01T00:00:00.000Z"),
          nights: 31,
        },
        resolver,
      ),
    ).rejects.toThrow(
      "Permanenza Alloggiati non valida: deve essere tra 1 e 30 giorni.",
    );
  });

  it("produce un record finale di 168 caratteri", async () => {
    const fields = await toAlloggiatiRecordFields(
      familyHead,
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 3,
      },
      resolver,
    );

    expect(buildAlloggiatiRecord(fields)).toHaveLength(168);
  });
});
