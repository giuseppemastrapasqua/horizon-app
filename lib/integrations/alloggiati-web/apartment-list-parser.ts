import {
  parseAlloggiatiTableCsv,
} from "./table-csv-parser";

export type AlloggiatiApartment = {
  apartmentId: string;
  description: string;
};

export function parseAlloggiatiApartmentList(
  csv: string,
): AlloggiatiApartment[] {
  const normalizedCsv =
    decodeNumericEntities(csv);

  const rows =
    parseAlloggiatiTableCsv(normalizedCsv);

  return rows.map((row, index) => {
    const apartmentId =
      readValue(
        row,
        "IdAppartamento",
        "IDAPPARTAMENTO",
      );

    const description =
      readValue(
        row,
        "Descrizione",
        "DESCRIZIONE",
      );

    if (!apartmentId || !/^\d+$/.test(apartmentId)) {
      throw new Error(
        `IdAppartamento non valido nella riga ${index + 2}.`,
      );
    }

    if (!description) {
      throw new Error(
        `Descrizione appartamento mancante nella riga ${index + 2}.`,
      );
    }

    return {
      apartmentId,
      description,
    };
  });
}

function readValue(
  row: Record<string, string>,
  ...names: string[]
): string | undefined {
  for (const name of names) {
    const value = row[name]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function decodeNumericEntities(
  value: string,
): string {
  return value.replace(
    /&#(x?[0-9a-f]+);/gi,
    (match, code: string) => {
      const hexadecimal =
        code[0]?.toLowerCase() === "x";

      const numericCode =
        Number.parseInt(
          hexadecimal
            ? code.slice(1)
            : code,
          hexadecimal ? 16 : 10,
        );

      if (
        !Number.isInteger(numericCode) ||
        numericCode < 0 ||
        numericCode > 0x10ffff
      ) {
        return match;
      }

      return String.fromCodePoint(
        numericCode,
      );
    },
  );
}