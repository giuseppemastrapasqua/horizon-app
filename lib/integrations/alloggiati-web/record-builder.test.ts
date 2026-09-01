import { describe, expect, it } from "vitest";

import { buildAlloggiatiRecord } from "./record-builder";

const fields = {
  guestType: "17",
  arrivalDate: "01/09/2026",
  stayDays: "03",
  lastName: "ROSSI",
  firstName: "MARIO",
  gender: "1",
  birthDate: "01/01/1980",
  birthCityCode: "015146",
  birthProvince: "MI",
  birthCountryCode: "IT-CODE",
  citizenshipCode: "IT-CODE",
  documentTypeCode: "IDENT",
  documentNumber: "AA1234567",
  documentIssuePlaceCode: "015146",
};

describe("buildAlloggiatiRecord", () => {
  it("genera un record di 168 caratteri", () => {
    expect(buildAlloggiatiRecord(fields)).toHaveLength(168);
  });

  it("rispetta gli offset ufficiali", () => {
    const record = buildAlloggiatiRecord(fields);

    expect(record.slice(0, 2)).toBe("17");
    expect(record.slice(2, 12)).toBe("01/09/2026");
    expect(record.slice(12, 14)).toBe("03");
    expect(record.slice(14, 64).trimEnd()).toBe("ROSSI");
    expect(record.slice(64, 94).trimEnd()).toBe("MARIO");
    expect(record.slice(94, 95)).toBe("1");
    expect(record.slice(95, 105)).toBe("01/01/1980");
    expect(record.slice(105, 114).trimEnd()).toBe("015146");
    expect(record.slice(114, 116)).toBe("MI");
    expect(record.slice(116, 125).trimEnd()).toBe("IT-CODE");
    expect(record.slice(125, 134).trimEnd()).toBe("IT-CODE");
    expect(record.slice(134, 139)).toBe("IDENT");
    expect(record.slice(139, 159).trimEnd()).toBe("AA1234567");
    expect(record.slice(159, 168).trimEnd()).toBe("015146");
  });

  it("rifiuta un campo troppo lungo", () => {
    expect(() =>
      buildAlloggiatiRecord({
        ...fields,
        guestType: "123",
      }),
    ).toThrow(
      "Campo Alloggiati troppo lungo: tipo alloggiato (3/2).",
    );
  });

  it("supporta campi documento blank per i membri", () => {
    const record = buildAlloggiatiRecord({
      ...fields,
      guestType: "19",
      documentTypeCode: "",
      documentNumber: "",
      documentIssuePlaceCode: "",
    });

    expect(record.slice(134, 139)).toBe("     ");
    expect(record.slice(139, 159)).toBe("                    ");
    expect(record.slice(159, 168)).toBe("         ");
  });
});
