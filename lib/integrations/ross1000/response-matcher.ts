import type {
  Ross1000ParsedResponse,
  Ross1000RecordResult,
  Ross1000ResultKind,
} from "./response-parser";

export type Ross1000ExpectedResult = {
  kind: Ross1000ResultKind;
  idswh: string;
};

export type Ross1000ResponseMatch = {
  expected: Ross1000ExpectedResult[];
  missing: Ross1000ExpectedResult[];
  unexpected: Ross1000RecordResult[];
  rejected: Ross1000RecordResult[];
  complete: boolean;
  successful: boolean;
};

export function matchRoss1000Response(
  payloadXml: string,
  response: Ross1000ParsedResponse,
): Ross1000ResponseMatch {
  const expected = [
    ...readExpected(
      payloadXml,
      "arrivo",
      "arrival",
    ),
    ...readExpected(
      payloadXml,
      "partenza",
      "departure",
    ),
    ...readExpected(
      payloadXml,
      "prenotazione",
      "reservation",
    ),
    ...readExpected(
      payloadXml,
      "eliminazione",
      "correction",
    ),
  ];

  const expectedKeys =
    new Set(
      expected.map(resultKey),
    );

  const responseKeys =
    new Set(
      response.results.map(resultKey),
    );

  const missing =
    expected.filter(
      (item) =>
        !responseKeys.has(
          resultKey(item),
        ),
    );

  const unexpected =
    response.results.filter(
      (item) =>
        !expectedKeys.has(
          resultKey(item),
        ),
    );

  const rejected =
    response.results.filter(
      (item) => !item.success,
    );

  const complete =
    missing.length === 0 &&
    unexpected.length === 0;

  return {
    expected,
    missing,
    unexpected,
    rejected,
    complete,
    successful:
      complete &&
      rejected.length === 0,
  };
}

function readExpected(
  xml: string,
  tag: string,
  kind: Ross1000ResultKind,
): Ross1000ExpectedResult[] {
  return readBlocks(xml, tag).map(
    (block) => {
      const idswh =
        readTag(
          block,
          "idswh",
        )?.trim();

      if (!idswh) {
        throw new Error(
          `Payload ROSS1000 con ${tag} senza idswh.`,
        );
      }

      return {
        kind,
        idswh,
      };
    },
  );
}

function resultKey(
  item: {
    kind: Ross1000ResultKind;
    idswh: string;
  },
): string {
  return `${item.kind}:${item.idswh}`;
}

function readBlocks(
  xml: string,
  tag: string,
): string[] {
  const escapedTag =
    escapeRegex(tag);

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "gi",
  );

  return Array.from(
    xml.matchAll(regex),
    (match) => match[1],
  );
}

function readTag(
  xml: string,
  tag: string,
): string | undefined {
  const escapedTag =
    escapeRegex(tag);

  const match =
    xml.match(
      new RegExp(
        `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
        "i",
      ),
    );

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
