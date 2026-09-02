import type {
  AlloggiatiWebSubmissionResult,
} from "./types";

export function parseAlloggiatiSendResponse(
  xml: string,
): AlloggiatiWebSubmissionResult {
  const acceptedText =
    readTag(xml, "SchedineValide");

  if (acceptedText === undefined) {
    throw new Error(
      "Risposta Alloggiati Web senza SchedineValide.",
    );
  }

  const normalizedAccepted =
    acceptedText.trim();

  if (!/^\d+$/.test(normalizedAccepted)) {
    throw new Error(
      "SchedineValide Alloggiati Web non valido.",
    );
  }

  const acceptedRecords =
    Number.parseInt(
      normalizedAccepted,
      10,
    );

  if (!Number.isSafeInteger(acceptedRecords)) {
    throw new Error(
      "SchedineValide Alloggiati Web fuori intervallo.",
    );
  }

  const codes =
    normalizedValues(
      readTags(xml, "ErroreCod"),
    );

  const descriptions =
    normalizedValues(
      readTags(xml, "ErroreDes"),
    );

  const details =
    normalizedValues(
      readTags(xml, "ErroreDettaglio"),
    );

  const messages = Array.from(
    new Set([
      ...descriptions,
      ...details,
    ]),
  );

  return {
    acceptedRecords,
    resultCode:
      codes.length > 0
        ? codes.join(" | ")
        : undefined,
    message:
      messages.length > 0
        ? messages.join(" | ")
        : undefined,
  };
}

function normalizedValues(
  values: string[],
): string[] {
  return values
    .map((value) => value.trim())
    .filter(Boolean);
}

function readTag(
  xml: string,
  tag: string,
): string | undefined {
  return readTags(xml, tag)[0];
}

function readTags(
  xml: string,
  tag: string,
): string[] {
  const escapedTag =
    tag.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );

  const regex = new RegExp(
    `<(?:\\w+:)?${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${escapedTag}>`,
    "gi",
  );

  return Array.from(
    xml.matchAll(regex),
    (match) =>
      decodeXml(match[1].trim()),
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