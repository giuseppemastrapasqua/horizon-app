export type SoggiorniamoClassificationGuest = {
  guestId: string;
  birthDate: Date;
};

export type SoggiorniamoResolvedResidence = {
  countryCode: string;
  municipalityCode?: string;
};

export type SoggiorniamoAutomaticClassification =
  | {
      status: "CLASSIFIED";
      source: "AUTO";
      guestTypeCode: number;
      reason: string;
    }
  | {
      status: "REVIEW_REQUIRED";
      source: "AUTO";
      guestTypeCode: null;
      reason: string;
    };

const MILAN_MUNICIPALITY_CODE = "F205";
const ITALY_COUNTRY_CODE = "100";

function utcDateOnly(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );
}

export function ageAtCheckIn(
  birthDate: Date,
  checkIn: Date,
): number {
  const birth = utcDateOnly(birthDate);
  const arrival = utcDateOnly(checkIn);

  let age = arrival.getUTCFullYear() - birth.getUTCFullYear();

  const birthdayNotReached =
    arrival.getUTCMonth() < birth.getUTCMonth() ||
    (
      arrival.getUTCMonth() === birth.getUTCMonth() &&
      arrival.getUTCDate() < birth.getUTCDate()
    );

  if (birthdayNotReached) {
    age -= 1;
  }

  return age;
}

export function classifySoggiorniamoGuest(input: {
  guest: SoggiorniamoClassificationGuest;
  checkIn: Date;
  residence?: SoggiorniamoResolvedResidence;
}): SoggiorniamoAutomaticClassification {
  const age = ageAtCheckIn(
    input.guest.birthDate,
    input.checkIn,
  );

  if (age < 0) {
    return {
      status: "REVIEW_REQUIRED",
      source: "AUTO",
      guestTypeCode: null,
      reason: "INVALID_BIRTH_DATE",
    };
  }

  if (age < 18) {
    return {
      status: "CLASSIFIED",
      source: "AUTO",
      guestTypeCode: 2,
      reason: "MINOR_UNDER_18",
    };
  }

  if (
    input.residence?.countryCode === ITALY_COUNTRY_CODE &&
    input.residence.municipalityCode === MILAN_MUNICIPALITY_CODE
  ) {
    return {
      status: "CLASSIFIED",
      source: "AUTO",
      guestTypeCode: 13,
      reason: "MILAN_RESIDENT",
    };
  }

  return {
    status: "REVIEW_REQUIRED",
    source: "AUTO",
    guestTypeCode: null,
    reason: "FISCAL_CLASSIFICATION_REQUIRED",
  };
}
