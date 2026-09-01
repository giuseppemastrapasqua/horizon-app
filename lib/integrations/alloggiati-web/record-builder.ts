export type AlloggiatiRecordFields = {
  guestType: string;
  arrivalDate: string;
  stayDays: string;
  lastName: string;
  firstName: string;
  gender: string;
  birthDate: string;
  birthCityCode: string;
  birthProvince: string;
  birthCountryCode: string;
  citizenshipCode: string;
  documentTypeCode: string;
  documentNumber: string;
  documentIssuePlaceCode: string;
};

function fixed(
  value: string,
  length: number,
  label: string,
): string {
  if (value.length > length) {
    throw new Error(
      `Campo Alloggiati troppo lungo: ${label} (${value.length}/${length}).`,
    );
  }

  return value.padEnd(length, " ");
}

export function buildAlloggiatiRecord(
  fields: AlloggiatiRecordFields,
): string {
  const record = [
    fixed(fields.guestType, 2, "tipo alloggiato"),
    fixed(fields.arrivalDate, 10, "data arrivo"),
    fixed(fields.stayDays, 2, "giorni permanenza"),
    fixed(fields.lastName, 50, "cognome"),
    fixed(fields.firstName, 30, "nome"),
    fixed(fields.gender, 1, "sesso"),
    fixed(fields.birthDate, 10, "data nascita"),
    fixed(fields.birthCityCode, 9, "comune nascita"),
    fixed(fields.birthProvince, 2, "provincia nascita"),
    fixed(fields.birthCountryCode, 9, "stato nascita"),
    fixed(fields.citizenshipCode, 9, "cittadinanza"),
    fixed(fields.documentTypeCode, 5, "tipo documento"),
    fixed(fields.documentNumber, 20, "numero documento"),
    fixed(
      fields.documentIssuePlaceCode,
      9,
      "luogo rilascio documento",
    ),
  ].join("");

  if (record.length !== 168) {
    throw new Error(
      `Record Alloggiati non valido: ${record.length} caratteri.`,
    );
  }

  return record;
}
