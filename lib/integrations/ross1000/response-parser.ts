export type Ross1000ResultKind =
  | "arrival"
  | "departure"
  | "reservation"
  | "correction";

export type Ross1000RecordResult = {
  kind: Ross1000ResultKind;
  idswh: string;
  success: boolean;
  error?: string;
};

export type Ross1000DayResult = {
  date?: string;
  results: Ross1000RecordResult[];
};

export type Ross1000ParsedResponse = {
  days: Ross1000DayResult[];
  results: Ross1000RecordResult[];
  allSuccessful: boolean | null;
};

export function parseRoss1000Response(
  xml: string,
): Ross1000ParsedResponse {
  if (!xml.trim()) {
    throw new Error(
      "Risposta ROSS1000 vuota.",
    );
  }

  const dayBlocks =
    readElementBlocks(
      xml,
      "risultatiGiorno",
    );

  const days =
    dayBlocks.map((day) => ({
      ...(readAttribute(
        day.openingTag,
        "data",
      )
        ? {
            date: readAttribute(
              day.openingTag,
              "data",
            ),
          }
        : {}),
      results: [
        ...parseContainer(
          day.innerXml,
          "arrivi",
          "arrivo",
          "arrival",
        ),
        ...parseContainer(
          day.innerXml,
          "partenze",
          "partenza",
          "departure",
        ),
        ...parseContainer(
          day.innerXml,
          "prenotazioni",
          "prenotazione",
          "reservation",
        ),
        ...parseContainer(
          day.innerXml,
          "retifiche",
          "eliminazione",
          "correction",
        ),
      ],
    }));

  const results =
    days.flatMap(
      (day) => day.results,
    );

  return {
    days,
    results,
    allSuccessful:
      results.length === 0
        ? null
        : results.every(
            (result) =>
              result.success,
          ),
  };
}

function parseContainer(
  xml: string,
  containerTag: string,
  resultTag: string,
  kind: Ross1000ResultKind,
): Ross1000RecordResult[] {
  const containers =
    readElementBlocks(
      xml,
      containerTag,
    );

  return containers.flatMap(
    (container) =>
      readElementBlocks(
        container.innerXml,
        resultTag,
      ).map((record) =>
        parseRecord(
          record.innerXml,
          kind,
        ),
      ),
  );
}

function parseRecord(
  xml: string,
  kind: Ross1000ResultKind,
): Ross1000RecordResult {
  const idswh =
    readTag(xml, "idswh")?.trim();

  const successText =
    readTag(
      xml,
      "successo",
    )?.trim().toLowerCase();

  const error =
    readTag(xml, "errore")?.trim();

  if (!idswh) {
    throw new Error(
      "Risposta ROSS1000 con risultato senza idswh.",
    );
  }

  if (
    successText !== "true" &&
    successText !== "false" &&
    successText !== "1" &&
    successText !== "0"
  ) {
    throw new Error(
      `Risposta ROSS1000 con successo non valido per ${idswh}.`,
    );
  }

  return {
    kind,
    idswh,
    success:
      successText === "true" ||
      successText === "1",
    ...(error
      ? { error }
      : {}),
  };
}

type XmlElementBlock = {
  openingTag: string;
  innerXml: string;
};

function readElementBlocks(
  xml: string,
  tag: string,
): XmlElementBlock[] {
  const escapedTag =
    escapeRegex(tag);

  const regex = new RegExp(
    `(<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>)([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "gi",
  );

  return Array.from(
    xml.matchAll(regex),
    (match) => ({
      openingTag: match[1],
      innerXml: match[2],
    }),
  );
}

function readAttribute(
  openingTag: string,
  attribute: string,
): string | undefined {
  const escapedAttribute =
    escapeRegex(attribute);

  const match =
    openingTag.match(
      new RegExp(
        `\\s${escapedAttribute}\\s*=\\s*["']([^"']*)["']`,
        "i",
      ),
    );

  return match
    ? decodeXml(match[1])
    : undefined;
}

function readTag(
  xml: string,
  tag: string,
): string | undefined {
  const escapedTag =
    escapeRegex(tag);

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "i",
  );

  const match = xml.match(regex);

  return match
    ? decodeXml(match[1].trim())
    : undefined;
}

function escapeRegex(
  value: string,
): string {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&",
  );
}

function decodeXml(
  value: string,
): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}
