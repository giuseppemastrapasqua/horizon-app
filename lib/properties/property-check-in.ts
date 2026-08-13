export const PROPERTY_CHECK_IN_TYPES = [
  "IN_PERSON",
  "SELF_CHECK_IN",
  "LOCKBOX",
  "SMART_LOCK",
  "RECEPTION",
  "OTHER",
] as const;

export type PropertyCheckInType =
  (typeof PROPERTY_CHECK_IN_TYPES)[number];

export const PROPERTY_CHECK_IN_TYPE_LABELS: Record<
  PropertyCheckInType,
  string
> = {
  IN_PERSON: "Consegna di persona",
  SELF_CHECK_IN: "Self check-in",
  LOCKBOX: "Cassetta portachiavi",
  SMART_LOCK: "Serratura intelligente",
  RECEPTION: "Reception",
  OTHER: "Altro",
};

export type PropertyCheckInConfigurationData = {
  id: string;
  propertyId: string;
  checkInType: string | null;
  arrivalInstructions: string | null;
  accessInstructions: string | null;
  buildingAccessCode: string | null;
  apartmentAccessCode: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  parkingInstructions: string | null;
  additionalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function isPropertyCheckInType(
  value: string,
): value is PropertyCheckInType {
  return PROPERTY_CHECK_IN_TYPES.some(
    (checkInType) => checkInType === value,
  );
}

export function getPropertyCheckInTypeLabel(
  value: string | null,
): string {
  if (!value) {
    return "Non specificato";
  }

  if (isPropertyCheckInType(value)) {
    return PROPERTY_CHECK_IN_TYPE_LABELS[value];
  }

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}