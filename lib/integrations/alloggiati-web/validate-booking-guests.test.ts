import {
  describe,
  expect,
  it,
} from "vitest";

import {
  validateBookingGuestsForAlloggiati,
} from "./validate-booking-guests";

const leader = {
  role: "FAMILY_HEAD" as const,
  firstName: "Mario",
  lastName: "Rossi",
  birthDate: new Date("1985-04-10"),
  birthCountry: "ITALIA",
  citizenship: "ITALIA",
  documentType: "IDENTITY_CARD",
  documentNumber: "AA1234567",
  documentIssueCountry: "ITALIA",
  documentIssueCity: "Milano",
};

const member = {
  role: "FAMILY_MEMBER" as const,
  firstName: "Anna",
  lastName: "Rossi",
  birthDate: new Date("1987-06-20"),
  birthCountry: "ITALIA",
  citizenship: "ITALIA",
};

describe("validateBookingGuestsForAlloggiati", () => {
  it("considera pronta una prenotazione completa", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [leader, member],
      );

    expect(result).toEqual({
      ready: true,
      issues: [],
    });
  });

  it("rileva un numero ospiti non coerente", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        3,
        [leader, member],
      );

    expect(result.issues).toContainEqual({
      code: "GUEST_COUNT_MISMATCH",
    });
  });

  it("richiede un leader", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        1,
        [member],
      );

    expect(result.issues).toContainEqual({
      code: "MISSING_LEADER",
    });
  });

  it("rileva più leader", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [leader, { ...leader }],
      );

    expect(result.issues).toContainEqual({
      code: "MULTIPLE_LEADERS",
    });
  });

  it("richiede il documento al leader", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        1,
        [{
          ...leader,
          documentNumber: "",
        }],
      );

    expect(result.ready).toBe(false);

    expect(result.issues).toContainEqual({
      code: "MISSING_DOCUMENT_NUMBER",
      guestIndex: 0,
    });
  });

  it("non richiede il documento a un membro", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [leader, member],
      );

    expect(
      result.issues.some(
        (issue) =>
          issue.guestIndex === 1 &&
          issue.code.startsWith("MISSING_DOCUMENT"),
      ),
    ).toBe(false);
  });

  it("rileva dati anagrafici incompleti", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [
          leader,
          {
            ...member,
            citizenship: "",
          },
        ],
      );

    expect(result.issues).toContainEqual({
      code: "MISSING_CITIZENSHIP",
      guestIndex: 1,
    });
  });

  it("rifiuta SINGLE_GUEST insieme ad altri ospiti", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [
          {
            ...leader,
            role: "SINGLE_GUEST",
          },
          member,
        ],
      );

    expect(result.ready).toBe(false);

    expect(result.issues).toContainEqual({
      code: "INVALID_GUEST_STRUCTURE",
    });
  });

  it("accetta GROUP_HEAD con GROUP_MEMBER", () => {
    const result =
      validateBookingGuestsForAlloggiati(
        2,
        [
          {
            ...leader,
            role: "GROUP_HEAD",
          },
          {
            ...member,
            role: "GROUP_MEMBER",
          },
        ],
      );

    expect(result).toEqual({
      ready: true,
      issues: [],
    });
  });
});