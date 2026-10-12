import type { Prisma, PropertyDocumentType } from "@prisma/client";

export const ownerTaskTypes = ["MAINTENANCE", "ISSUE"] as const;
export const ownerPropertyDocumentTypes: PropertyDocumentType[] = [
  "CONTRACT",
  "CIN",
  "CIR",
  "SCIA",
  "ENERGY_CERTIFICATE",
  "INSURANCE",
  "FLOOR_PLAN",
];

export function scopedPropertyFilter(
  ids: string[],
  selected?: string,
): Prisma.StringFilter {
  return selected ? { in: ids, equals: selected } : { in: ids };
}

export function ownerBookingLabel(id: string) {
  return `Prenotazione ${id.slice(-8).toUpperCase()}`;
}

export function isPublishedDocument(status: string) {
  return status === "FINAL" || status === "ISSUED";
}
