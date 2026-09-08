"use server";

import type { BookingGuestGender, BookingGuestRole } from "@prisma/client";

import { hashGuestCheckInToken, isGuestCheckInLinkUsable } from "@/lib/bookings/guest-check-in-token";
import { PublicAlloggiatiReferenceProvider } from "@/lib/integrations/alloggiati-web/public-reference-provider";
import { validateBookingGuestsForAlloggiati } from "@/lib/integrations/alloggiati-web/validate-booking-guests";
import { prisma } from "@/lib/prisma";

const referenceProvider = new PublicAlloggiatiReferenceProvider();

type GuestInput = {
  role: BookingGuestRole;
  firstName: string;
  lastName: string;
  gender: BookingGuestGender;
  birthDate: Date;
  birthCity: string | null;
  birthProvince: string | null;
  birthCountry: string;
  citizenship: string;
  documentType: string | null;
  documentNumber: string | null;
  documentIssueCountry: string | null;
  documentIssueCity: string | null;
};

function requiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("Compila tutti i campi obbligatori.");
  }
  return value.trim();
}

function optionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Data di nascita non valida.");
  }
  return date;
}

function parseGender(value: string): BookingGuestGender {
  if (value !== "MALE" && value !== "FEMALE") {
    throw new Error("Sesso non valido.");
  }
  return value;
}

function parseRole(value: string): BookingGuestRole {
  if (
    value !== "SINGLE_GUEST" &&
    value !== "FAMILY_HEAD" &&
    value !== "GROUP_HEAD" &&
    value !== "FAMILY_MEMBER" &&
    value !== "GROUP_MEMBER"
  ) {
    throw new Error("Ruolo ospite non valido.");
  }
  return value;
}

export async function saveGuestCheckInAction(formData: FormData) {
  const token = requiredString(formData, "token");
  const tokenHash = hashGuestCheckInToken(token);

  const link = await prisma.guestCheckInLink.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      revokedAt: true,
      booking: {
        select: {
          id: true,
          guests: true,
        },
      },
    },
  });

  if (
    !link ||
    !isGuestCheckInLinkUsable({
      expiresAt: link.expiresAt,
      revokedAt: link.revokedAt,
    })
  ) {
    throw new Error("Il link non è più valido. Richiedi un nuovo link alla struttura.");
  }

  const guestCount = link.booking.guests;
  const guests: GuestInput[] = [];

  for (let index = 0; index < guestCount; index += 1) {
    const prefix = `guests.${index}`;
    guests.push({
      role: parseRole(requiredString(formData, `${prefix}.role`)),
      firstName: requiredString(formData, `${prefix}.firstName`),
      lastName: requiredString(formData, `${prefix}.lastName`),
      gender: parseGender(requiredString(formData, `${prefix}.gender`)),
      birthDate: parseDate(requiredString(formData, `${prefix}.birthDate`)),
      birthCity: optionalString(formData, `${prefix}.birthCity`),
      birthProvince: optionalString(formData, `${prefix}.birthProvince`),
      birthCountry: requiredString(formData, `${prefix}.birthCountry`),
      citizenship: requiredString(formData, `${prefix}.citizenship`),
      documentType: optionalString(formData, `${prefix}.documentType`),
      documentNumber: optionalString(formData, `${prefix}.documentNumber`),
      documentIssueCountry: optionalString(formData, `${prefix}.documentIssueCountry`),
      documentIssueCity: optionalString(formData, `${prefix}.documentIssueCity`),
    });
  }

  const compliance = validateBookingGuestsForAlloggiati(
    guestCount,
    guests,
  );

  if (!compliance.ready) {
    throw new Error("I dati degli ospiti non sono completi per Alloggiati Web.");
  }

  const resolver = await referenceProvider.getResolver();

  for (const guest of guests) {
    if (!(await resolver.resolveCountryCode(guest.birthCountry))) {
      throw new Error(`Paese di nascita non riconosciuto: ${guest.birthCountry}.`);
    }

    if (!(await resolver.resolveCountryCode(guest.citizenship))) {
      throw new Error(`Cittadinanza non riconosciuta: ${guest.citizenship}.`);
    }

    if (await resolver.isItaly(guest.birthCountry)) {
      if (!guest.birthCity || !guest.birthProvince) {
        throw new Error("Per i nati in Italia sono obbligatori comune e provincia di nascita.");
      }

      if (!(await resolver.resolveMunicipalityCode(guest.birthCity, guest.birthProvince))) {
        throw new Error(`Comune di nascita non riconosciuto: ${guest.birthCity}.`);
      }
    }

    const isLeader =
      guest.role === "SINGLE_GUEST" ||
      guest.role === "FAMILY_HEAD" ||
      guest.role === "GROUP_HEAD";

    if (isLeader) {
      if (!guest.documentType || !(await resolver.resolveDocumentTypeCode(guest.documentType))) {
        throw new Error("Tipo documento non riconosciuto.");
      }

      if (!guest.documentIssueCountry || !(await resolver.resolveCountryCode(guest.documentIssueCountry))) {
        throw new Error("Paese di rilascio del documento non riconosciuto.");
      }
    }
  }

  await prisma.$transaction(async (transaction) => {
    const currentLink = await transaction.guestCheckInLink.findUnique({
      where: { tokenHash },
      select: {
        expiresAt: true,
        revokedAt: true,
        bookingId: true,
      },
    });

    if (
      !currentLink ||
      currentLink.bookingId !== link.booking.id ||
      !isGuestCheckInLinkUsable({
        expiresAt: currentLink.expiresAt,
        revokedAt: currentLink.revokedAt,
      })
    ) {
      throw new Error("Il link non è più valido. Richiedi un nuovo link alla struttura.");
    }

    await transaction.bookingGuest.deleteMany({
      where: { bookingId: link.booking.id },
    });

    await transaction.bookingGuest.createMany({
      data: guests.map((guest) => ({
        bookingId: link.booking.id,
        ...guest,
      })),
    });
  });

  return { success: true as const };
}
