"use server";

import type {
  BookingGuestGender,
  BookingGuestRole,
} from "@prisma/client";

import {
  hashGuestCheckInToken,
  isGuestCheckInLinkUsable,
} from "@/lib/bookings/guest-check-in-token";
import { PublicAlloggiatiReferenceProvider } from "@/lib/integrations/alloggiati-web/public-reference-provider";
import { validateBookingGuestsForAlloggiati } from "@/lib/integrations/alloggiati-web/validate-booking-guests";
import { classifyAndPersistBookingGuests } from "@/lib/integrations/soggiorniamo/fiscal-classification-service";
import { PrismaSoggiorniamoFiscalClassificationRepository } from "@/lib/integrations/soggiorniamo/prisma-fiscal-classification-repository";
import { prisma } from "@/lib/prisma";

import {
  getGuestCheckInLanguage,
  guestCheckInServerError,
} from "./server-translations";
import type { GuestCheckInLanguage } from "./translations";

const referenceProvider =
  new PublicAlloggiatiReferenceProvider();

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
  residenceCountry: string;
  residenceCity: string | null;
  residenceProvince: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentIssueCountry: string | null;
  documentIssueCity: string | null;
};

type ExistingGuestIdentity = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
};

function requiredString(
  formData: FormData,
  key: string,
  language: GuestCheckInLanguage,
) {
  const value = formData.get(key);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      guestCheckInServerError(language, "required"),
    );
  }

  return value.trim();
}

function optionalString(
  formData: FormData,
  key: string,
) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function parseDate(
  value: string,
  language: GuestCheckInLanguage,
) {
  const date = new Date(
    `${value}T00:00:00.000Z`,
  );

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      guestCheckInServerError(
        language,
        "invalidBirthDate",
      ),
    );
  }

  return date;
}

function parseGender(
  value: string,
  language: GuestCheckInLanguage,
): BookingGuestGender {
  if (
    value !== "MALE" &&
    value !== "FEMALE"
  ) {
    throw new Error(
      guestCheckInServerError(
        language,
        "invalidGender",
      ),
    );
  }

  return value;
}

function parseRole(
  value: string,
  language: GuestCheckInLanguage,
): BookingGuestRole {
  if (
    value !== "SINGLE_GUEST" &&
    value !== "FAMILY_HEAD" &&
    value !== "GROUP_HEAD" &&
    value !== "FAMILY_MEMBER" &&
    value !== "GROUP_MEMBER"
  ) {
    throw new Error(
      guestCheckInServerError(
        language,
        "invalidRole",
      ),
    );
  }

  return value;
}

function normalizeIdentityText(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function guestIdentityKey(input: {
  firstName: string;
  lastName: string;
  birthDate: Date;
}) {
  return [
    normalizeIdentityText(input.firstName),
    normalizeIdentityText(input.lastName),
    input.birthDate.toISOString().slice(0, 10),
  ].join("|");
}

function matchExistingGuestIds(
  existingGuests: ExistingGuestIdentity[],
  guests: GuestInput[],
) {
  const available = new Map<
    string,
    ExistingGuestIdentity[]
  >();

  for (const guest of existingGuests) {
    const key = guestIdentityKey(guest);
    const bucket = available.get(key) ?? [];

    bucket.push(guest);
    available.set(key, bucket);
  }

  return guests.map((guest) => {
    const key = guestIdentityKey(guest);
    const bucket = available.get(key);

    if (!bucket?.length) {
      return null;
    }

    return bucket.shift()?.id ?? null;
  });
}

export async function saveGuestCheckInAction(
  formData: FormData,
) {
  const language =
    getGuestCheckInLanguage(formData);

  const token = requiredString(
    formData,
    "token",
    language,
  );

  const tokenHash =
    hashGuestCheckInToken(token);

  const link =
    await prisma.guestCheckInLink.findUnique({
      where: {
        tokenHash,
      },
      select: {
        expiresAt: true,
        revokedAt: true,
        booking: {
          select: {
            id: true,
            guests: true,
            checkIn: true,
            checkOut: true,
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
    throw new Error(
      guestCheckInServerError(
        language,
        "invalidLink",
      ),
    );
  }

  const guestCount = link.booking.guests;
  const guests: GuestInput[] = [];

  for (
    let index = 0;
    index < guestCount;
    index += 1
  ) {
    const prefix = `guests.${index}`;

    guests.push({
      role: parseRole(
        requiredString(
          formData,
          `${prefix}.role`,
          language,
        ),
        language,
      ),
      firstName: requiredString(
        formData,
        `${prefix}.firstName`,
        language,
      ),
      lastName: requiredString(
        formData,
        `${prefix}.lastName`,
        language,
      ),
      gender: parseGender(
        requiredString(
          formData,
          `${prefix}.gender`,
          language,
        ),
        language,
      ),
      birthDate: parseDate(
        requiredString(
          formData,
          `${prefix}.birthDate`,
          language,
        ),
        language,
      ),
      birthCity: optionalString(
        formData,
        `${prefix}.birthCity`,
      ),
      birthProvince: optionalString(
        formData,
        `${prefix}.birthProvince`,
      ),
      birthCountry: requiredString(
        formData,
        `${prefix}.birthCountry`,
        language,
      ),
      citizenship: requiredString(
        formData,
        `${prefix}.citizenship`,
        language,
      ),
      residenceCountry: requiredString(
        formData,
        `${prefix}.residenceCountry`,
        language,
      ),
      residenceCity: optionalString(
        formData,
        `${prefix}.residenceCity`,
      ),
      residenceProvince: optionalString(
        formData,
        `${prefix}.residenceProvince`,
      ),
      documentType: optionalString(
        formData,
        `${prefix}.documentType`,
      ),
      documentNumber: optionalString(
        formData,
        `${prefix}.documentNumber`,
      ),
      documentIssueCountry: optionalString(
        formData,
        `${prefix}.documentIssueCountry`,
      ),
      documentIssueCity: optionalString(
        formData,
        `${prefix}.documentIssueCity`,
      ),
    });
  }

  const compliance =
    validateBookingGuestsForAlloggiati(
      guestCount,
      guests,
    );

  if (!compliance.ready) {
    throw new Error(
      guestCheckInServerError(
        language,
        "incomplete",
      ),
    );
  }

  const resolver =
    await referenceProvider.getResolver();

  for (const guest of guests) {
    if (
      !(await resolver.resolveCountryCode(
        guest.birthCountry,
      ))
    ) {
      throw new Error(
        guestCheckInServerError(
          language,
          "birthCountry",
          guest.birthCountry,
        ),
      );
    }

    if (
      !(await resolver.resolveCountryCode(
        guest.citizenship,
      ))
    ) {
      throw new Error(
        guestCheckInServerError(
          language,
          "citizenship",
          guest.citizenship,
        ),
      );
    }

    if (
      !(await resolver.resolveCountryCode(
        guest.residenceCountry,
      ))
    ) {
      throw new Error(
        `Paese di residenza non riconosciuto: ${guest.residenceCountry}.`,
      );
    }

    if (
      await resolver.isItaly(
        guest.residenceCountry,
      )
    ) {
      if (
        !guest.residenceCity ||
        !guest.residenceProvince
      ) {
        throw new Error(
          "Per la residenza in Italia sono obbligatori Comune e Provincia.",
        );
      }

      if (
        !(await resolver.resolveMunicipalityCode(
          guest.residenceCity,
          guest.residenceProvince,
        ))
      ) {
        throw new Error(
          `Comune di residenza non riconosciuto: ${guest.residenceCity}.`,
        );
      }
    }

    if (
      await resolver.isItaly(
        guest.birthCountry,
      )
    ) {
      if (
        !guest.birthCity ||
        !guest.birthProvince
      ) {
        throw new Error(
          guestCheckInServerError(
            language,
            "italyBirthPlace",
          ),
        );
      }

      if (
        !(await resolver.resolveMunicipalityCode(
          guest.birthCity,
          guest.birthProvince,
        ))
      ) {
        throw new Error(
          guestCheckInServerError(
            language,
            "municipality",
            guest.birthCity,
          ),
        );
      }
    }

    const isLeader =
      guest.role === "SINGLE_GUEST" ||
      guest.role === "FAMILY_HEAD" ||
      guest.role === "GROUP_HEAD";

    if (isLeader) {
      if (
        !guest.documentType ||
        !(await resolver.resolveDocumentTypeCode(
          guest.documentType,
        ))
      ) {
        throw new Error(
          guestCheckInServerError(
            language,
            "documentType",
          ),
        );
      }

      if (
        !guest.documentIssueCountry ||
        !(await resolver.resolveCountryCode(
          guest.documentIssueCountry,
        ))
      ) {
        throw new Error(
          guestCheckInServerError(
            language,
            "documentIssueCountry",
          ),
        );
      }
    }
  }

  await prisma.$transaction(
    async (transaction) => {
      const currentLink =
        await transaction.guestCheckInLink.findUnique({
          where: {
            tokenHash,
          },
          select: {
            expiresAt: true,
            revokedAt: true,
            bookingId: true,
          },
        });

      if (
        !currentLink ||
        currentLink.bookingId !==
          link.booking.id ||
        !isGuestCheckInLinkUsable({
          expiresAt: currentLink.expiresAt,
          revokedAt: currentLink.revokedAt,
        })
      ) {
        throw new Error(
          guestCheckInServerError(
            language,
            "invalidLink",
          ),
        );
      }

      const confirmedTransmission =
        await transaction.alloggiatiWebTransmission.findFirst(
          {
            where: {
              bookingId: link.booking.id,
              status: "CONFIRMED",
            },
            select: {
              id: true,
            },
          },
        );

      if (confirmedTransmission) {
        throw new Error(
          guestCheckInServerError(
            language,
            "alreadySent",
          ),
        );
      }

      const existingGuests =
        await transaction.bookingGuest.findMany({
          where: {
            bookingId: link.booking.id,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthDate: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      const matchedIds =
        matchExistingGuestIds(
          existingGuests,
          guests,
        );

      const preservedIds: string[] = [];

      for (
        let index = 0;
        index < guests.length;
        index += 1
      ) {
        const guest = guests[index];
        const existingId = matchedIds[index];

        if (existingId) {
          await transaction.bookingGuest.update({
            where: {
              id: existingId,
            },
            data: guest,
          });

          preservedIds.push(existingId);
          continue;
        }

        const created =
          await transaction.bookingGuest.create({
            data: {
              bookingId: link.booking.id,
              ...guest,
            },
            select: {
              id: true,
            },
          });

        preservedIds.push(created.id);
      }

      await transaction.bookingGuest.deleteMany({
        where: {
          bookingId: link.booking.id,
          ...(preservedIds.length
            ? {
                id: {
                  notIn: preservedIds,
                },
              }
            : {}),
        },
      });

      const persistedGuests =
        await transaction.bookingGuest.findMany({
          where: {
            bookingId: link.booking.id,
          },
          select: {
            id: true,
            birthDate: true,
            residenceCountry: true,
            residenceCity: true,
            residenceProvince: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      const fiscalRepository =
        new PrismaSoggiorniamoFiscalClassificationRepository(
          transaction,
        );

      await classifyAndPersistBookingGuests({
        booking: {
          id: link.booking.id,
          checkIn: link.booking.checkIn,
          checkOut: link.booking.checkOut,
          bookingGuests: persistedGuests,
        },
        repository: fiscalRepository,
      });

      await transaction.guestCheckInLink.updateMany({
        where: {
          bookingId: link.booking.id,
          tokenHash,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    },
  );

  return {
    success: true as const,
  };
}
