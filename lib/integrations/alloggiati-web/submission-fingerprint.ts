import {
  createHash,
} from "node:crypto";

import type {
  AlloggiatiWebSubmission,
} from "./types";

function encodePart(
  value: string,
): string {
  return `${value.length}:${value}`;
}

export function createAlloggiatiSubmissionFingerprint(
  submission: AlloggiatiWebSubmission,
): string {
  const apartmentId =
    submission.apartmentId?.trim();

  if (
    apartmentId &&
    !/^\d+$/.test(apartmentId)
  ) {
    throw new Error(
      "IdAppartamento Alloggiati Web non valido.",
    );
  }

  if (submission.records.length === 0) {
    throw new Error(
      "Submission Alloggiati Web senza schedine.",
    );
  }

  const destination = apartmentId
    ? `APARTMENT:${apartmentId}`
    : "STANDARD";

  const canonicalPayload = [
    encodePart(destination),
    ...submission.records.map(encodePart),
  ].join("|");

  return createHash("sha256")
    .update(canonicalPayload, "utf8")
    .digest("hex");
}
