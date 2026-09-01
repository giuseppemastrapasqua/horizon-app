import type {
  AlloggiatiReferenceData,
} from "./table-reference-resolver";

const ITALY_CODE = "100000100";

export function parsePublicAlloggiatiReferenceData(
  municipalitiesCsv: string,
  countriesCsv: string,
  documentTypesCsv: string,
): AlloggiatiReferenceData {
  const municipalities = parseRows(
    municipalitiesCsv,
    [
      "Codice",
      "Descrizione",
      "Provincia",
      "DataFineVal",
    ],
  )
    .filter(isActive)
    .map((row) => ({
      code: row.Codice,
      name: row.Descrizione,
      province: row.Provincia || null,
    }));

  const countries = parseRows(
    countriesCsv,
    [
      "Codice",
      "Descrizione",
      "Provincia",
      "DataFineVal",
    ],
  )
    .filter(isActive)
    .map((row) => ({
      code: row.Codice,
      name: row.Descrizione,
      isItaly: row.Codice === ITALY_CODE,
    }));

  const documentTypes = parseRows(
    documentTypesCsv,
    [
      "Codice",
      "Descrizione",
    ],
  ).map((row) => ({
    code: row.Codice,
    name: row.Descrizione,
  }));

  return {
    countries,
    municipalities,
    documentTypes,
  };
}

type CsvRow = Record<string, string>;

function parseRows(
  csv: string,
  expectedHeaders: string[],
): CsvRow[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    throw new Error(
      "Tabella pubblica Alloggiati vuota.",
    );
  }

  const headers = splitLine(lines[0]);

  if (
    headers.length !== expectedHeaders.length ||
    headers.some(
      (header, index) =>
        header !== expectedHeaders[index],
    )
  ) {
    throw new Error(
      "Header tabella pubblica Alloggiati non valido.",
    );
  }

  return lines.slice(1).map(
    (line, index) => {
      const values = splitLine(line);

      if (values.length !== headers.length) {
        throw new Error(
          `Riga tabella pubblica Alloggiati non valida: ${index + 2}.`,
        );
      }

      return Object.fromEntries(
        headers.map(
          (header, columnIndex) => [
            header,
            values[columnIndex],
          ],
        ),
      );
    },
  );
}

function splitLine(
  line: string,
): string[] {
  return line
    .split(",")
    .map((value) => value.trim());
}

function isActive(
  row: CsvRow,
): boolean {
  return !row.DataFineVal;
}
