export type AlloggiatiCsvRow = Record<
  string,
  string
>;

export function parseAlloggiatiTableCsv(
  csv: string,
): AlloggiatiCsvRow[] {
  const lines = csv
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = splitLine(lines[0]);

  if (
    headers.length === 0 ||
    headers.some((header) => !header)
  ) {
    throw new Error(
      "Header CSV Alloggiati non valido.",
    );
  }

  return lines.slice(1).map(
    (line, index) => {
      const values = splitLine(line);

      if (values.length !== headers.length) {
        throw new Error(
          `Riga CSV Alloggiati non valida: ${index + 2}.`,
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
    .split(";")
    .map((value) => value.trim());
}
