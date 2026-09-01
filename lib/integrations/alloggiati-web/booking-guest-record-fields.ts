import type {
  BookingGuestGender,
  BookingGuestRole,
} from "@prisma/client";

import { resolveDocumentIssuePlaceCode } from "./document-issue-place";
import { toAlloggiatiGuestTypeCode } from "./guest-role-code";
import type {
  AlloggiatiReferenceResolver,
} from "./reference-resolver";
import { requireReferenceCode } from "./reference-resolver";
import type { AlloggiatiRecordFields } from "./record-builder";

export type BookingGuestRecordInput = {
  role: BookingGuestRole;
  firstName: string;
  lastName: string;
  gender: BookingGuestGender;
  birthDate: Date;
  birthCity?: string | null;
  birthProvince?: string | null;
  birthCountry: string;
  citizenship: string;
  documentType?: string | null;
  documentNumber?: string | null;
  documentIssueCountry?: string | null;
  documentIssueCity?: string | null;
};

export type BookingStayInput = {
  checkIn: Date;
  nights: number;
};

function formatDate(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    throw new Error("Data Alloggiati non valida.");
  }

  const day = String(value.getUTCDate()).padStart(2, "0");
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const year = value.getUTCFullYear();

  return `${day}/${month}/${year}`;
}

function formatStayDays(nights: number): string {
  if (
    !Number.isInteger(nights) ||
    nights < 1 ||
    nights > 30
  ) {
    throw new Error(
      "Permanenza Alloggiati non valida: deve essere tra 1 e 30 giorni.",
    );
  }

  return String(nights).padStart(2, "0");
}

function toGenderCode(
  gender: BookingGuestGender,
): string {
  return gender === "MALE" ? "1" : "2";
}

function requiresDocument(
  role: BookingGuestRole,
): boolean {
  return (
    role === "SINGLE_GUEST" ||
    role === "FAMILY_HEAD" ||
    role === "GROUP_HEAD"
  );
}

export async function toAlloggiatiRecordFields(
  guest: BookingGuestRecordInput,
  stay: BookingStayInput,
  resolver: AlloggiatiReferenceResolver,
): Promise<AlloggiatiRecordFields> {
  const italianBirth = await resolver.isItaly(
    guest.birthCountry,
  );

  let birthCityCode = "";
  let birthProvince = "";

  if (italianBirth) {
    const city = guest.birthCity?.trim();
    const province = guest.birthProvince?.trim();

    if (!city || !province) {
      throw new Error(
        "Comune e provincia di nascita obbligatori per nascita in Italia.",
      );
    }

    birthCityCode = await requireReferenceCode(
      resolver.resolveMunicipalityCode(city, province),
      "comune di nascita",
    );

    birthProvince = province;
  }

  const birthCountryCode = await requireReferenceCode(
    resolver.resolveCountryCode(guest.birthCountry),
    "stato di nascita",
  );

  const citizenshipCode = await requireReferenceCode(
    resolver.resolveCountryCode(guest.citizenship),
    "cittadinanza",
  );

  let documentTypeCode = "";
  let documentNumber = "";
  let documentIssuePlaceCode = "";

  if (requiresDocument(guest.role)) {
    const documentType = guest.documentType?.trim();
    const number = guest.documentNumber?.trim();
    const issueCountry =
      guest.documentIssueCountry?.trim();

    if (!documentType || !number || !issueCountry) {
      throw new Error(
        "Documento obbligatorio per il capo scheda Alloggiati.",
      );
    }

    documentTypeCode = await requireReferenceCode(
      resolver.resolveDocumentTypeCode(documentType),
      "tipo documento",
    );

    documentNumber = number;

    documentIssuePlaceCode =
      await resolveDocumentIssuePlaceCode(
        {
          country: issueCountry,
          city: guest.documentIssueCity,
        },
        resolver,
      );
  }

  return {
    guestType: toAlloggiatiGuestTypeCode(guest.role),
    arrivalDate: formatDate(stay.checkIn),
    stayDays: formatStayDays(stay.nights),
    lastName: guest.lastName.trim(),
    firstName: guest.firstName.trim(),
    gender: toGenderCode(guest.gender),
    birthDate: formatDate(guest.birthDate),
    birthCityCode,
    birthProvince,
    birthCountryCode,
    citizenshipCode,
    documentTypeCode,
    documentNumber,
    documentIssuePlaceCode,
  };
}
