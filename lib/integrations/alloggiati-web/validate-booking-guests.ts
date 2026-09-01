export type AlloggiatiGuestInput = {
  role:
    | "SINGLE_GUEST"
    | "FAMILY_HEAD"
    | "GROUP_HEAD"
    | "FAMILY_MEMBER"
    | "GROUP_MEMBER";
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthCountry: string;
  citizenship: string;
  documentType?: string | null;
  documentNumber?: string | null;
  documentIssueCountry?: string | null;
};

export type AlloggiatiComplianceIssueCode =
  | "GUEST_COUNT_MISMATCH"
  | "MISSING_LEADER"
  | "INVALID_GUEST_STRUCTURE"
  | "MULTIPLE_LEADERS"
  | "MISSING_FIRST_NAME"
  | "MISSING_LAST_NAME"
  | "INVALID_BIRTH_DATE"
  | "MISSING_BIRTH_COUNTRY"
  | "MISSING_CITIZENSHIP"
  | "MISSING_DOCUMENT_TYPE"
  | "MISSING_DOCUMENT_NUMBER"
  | "MISSING_DOCUMENT_ISSUE_COUNTRY";

export type AlloggiatiComplianceIssue = {
  code: AlloggiatiComplianceIssueCode;
  guestIndex?: number;
};

export type AlloggiatiComplianceResult = {
  ready: boolean;
  issues: AlloggiatiComplianceIssue[];
};

export function validateBookingGuestsForAlloggiati(
  expectedGuestCount: number,
  guests: AlloggiatiGuestInput[],
): AlloggiatiComplianceResult {
  const issues: AlloggiatiComplianceIssue[] = [];

  if (
    !Number.isInteger(expectedGuestCount) ||
    expectedGuestCount < 1 ||
    guests.length !== expectedGuestCount
  ) {
    issues.push({
      code: "GUEST_COUNT_MISMATCH",
    });
  }

  const leaders = guests.filter(
    (guest) =>
      guest.role === "SINGLE_GUEST" ||
      guest.role === "FAMILY_HEAD" ||
      guest.role === "GROUP_HEAD",
  );

  if (leaders.length === 0) {
    issues.push({
      code: "MISSING_LEADER",
    });
  } else if (leaders.length > 1) {
    issues.push({
      code: "MULTIPLE_LEADERS",
    });
  }

  const singleGuest = guests.some(
    (guest) => guest.role === "SINGLE_GUEST",
  );

  if (singleGuest && guests.length !== 1) {
    issues.push({
      code: "INVALID_GUEST_STRUCTURE",
    });
  }

  guests.forEach((guest, guestIndex) => {
    if (!guest.firstName.trim()) {
      issues.push({
        code: "MISSING_FIRST_NAME",
        guestIndex,
      });
    }

    if (!guest.lastName.trim()) {
      issues.push({
        code: "MISSING_LAST_NAME",
        guestIndex,
      });
    }

    if (
      !(guest.birthDate instanceof Date) ||
      Number.isNaN(guest.birthDate.getTime())
    ) {
      issues.push({
        code: "INVALID_BIRTH_DATE",
        guestIndex,
      });
    }

    if (!guest.birthCountry.trim()) {
      issues.push({
        code: "MISSING_BIRTH_COUNTRY",
        guestIndex,
      });
    }

    if (!guest.citizenship.trim()) {
      issues.push({
        code: "MISSING_CITIZENSHIP",
        guestIndex,
      });
    }

    if (
      guest.role === "SINGLE_GUEST" ||
      guest.role === "FAMILY_HEAD" ||
      guest.role === "GROUP_HEAD"
    ) {
      if (!guest.documentType?.trim()) {
        issues.push({
          code: "MISSING_DOCUMENT_TYPE",
          guestIndex,
        });
      }

      if (!guest.documentNumber?.trim()) {
        issues.push({
          code: "MISSING_DOCUMENT_NUMBER",
          guestIndex,
        });
      }

      if (!guest.documentIssueCountry?.trim()) {
        issues.push({
          code: "MISSING_DOCUMENT_ISSUE_COUNTRY",
          guestIndex,
        });
      }
    }
  });

  return {
    ready: issues.length === 0,
    issues,
  };
}