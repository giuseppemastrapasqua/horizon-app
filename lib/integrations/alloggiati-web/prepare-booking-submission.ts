import type {
  BookingGuestGender,
  BookingGuestRole,
} from "@prisma/client";

import { toAlloggiatiRecordFields } from "./booking-guest-record-fields";
import type {
  AlloggiatiReferenceResolver,
} from "./reference-resolver";
import { buildAlloggiatiRecord } from "./record-builder";
import type { AlloggiatiWebSubmission } from "./types";
import {
  validateBookingGuestsForAlloggiati,
} from "./validate-booking-guests";

export type SubmissionBookingGuest = {
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

export type PrepareBookingSubmissionInput = {
  checkIn: Date;
  nights: number;
  expectedGuests: number;
  guests: SubmissionBookingGuest[];
  apartmentId?: string;
};

export async function prepareBookingSubmission(
  input: PrepareBookingSubmissionInput,
  resolver: AlloggiatiReferenceResolver,
): Promise<AlloggiatiWebSubmission> {
  const validation =
    validateBookingGuestsForAlloggiati(
      input.expectedGuests,
      input.guests,
    );

  if (!validation.ready) {
    const codes = validation.issues
      .map((issue) => issue.code)
      .join(", ");

    throw new Error(
      `Dati ospiti Alloggiati non pronti: ${codes}.`,
    );
  }

  const records = await Promise.all(
    input.guests.map(async (guest) => {
      const fields = await toAlloggiatiRecordFields(
        guest,
        {
          checkIn: input.checkIn,
          nights: input.nights,
        },
        resolver,
      );

      return buildAlloggiatiRecord(fields);
    }),
  );

  return {
    records,
    ...(input.apartmentId
      ? { apartmentId: input.apartmentId }
      : {}),
  };
}
