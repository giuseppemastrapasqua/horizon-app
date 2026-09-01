import { describe, expect, it } from "vitest";

import { MockAlloggiatiReferenceResolver } from "./mock-reference-resolver";
import { prepareBookingSubmission } from "./prepare-booking-submission";

const resolver = new MockAlloggiatiReferenceResolver(
  {
    ITALIA: "IT-CODE",
  },
  {
    "Milano|MI": "MI-CODE",
    Milano: "MI-CODE",
  },
  {
    CARTA_IDENTITA: "CI",
  },
);

const head = {
  role: "FAMILY_HEAD" as const,
  firstName: "Mario",
  lastName: "Rossi",
  gender: "MALE" as const,
  birthDate: new Date("1980-01-02T00:00:00.000Z"),
  birthCity: "Milano",
  birthProvince: "MI",
  birthCountry: "ITALIA",
  citizenship: "ITALIA",
  documentType: "CARTA_IDENTITA",
  documentNumber: "AA1234567",
  documentIssueCountry: "ITALIA",
  documentIssueCity: "Milano",
};

const member = {
  role: "FAMILY_MEMBER" as const,
  firstName: "Anna",
  lastName: "Rossi",
  gender: "FEMALE" as const,
  birthDate: new Date("1982-03-04T00:00:00.000Z"),
  birthCity: "Milano",
  birthProvince: "MI",
  birthCountry: "ITALIA",
  citizenship: "ITALIA",
  documentType: null,
  documentNumber: null,
  documentIssueCountry: null,
  documentIssueCity: null,
};

describe("prepareBookingSubmission", () => {
  it("prepara un record per un ospite singolo", async () => {
    const submission = await prepareBookingSubmission(
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 3,
        expectedGuests: 1,
        guests: [
          {
            ...head,
            role: "SINGLE_GUEST",
          },
        ],
      },
      resolver,
    );

    expect(submission.records).toHaveLength(1);
    expect(submission.records[0]).toHaveLength(168);
    expect(submission.records[0].slice(0, 2)).toBe("16");
  });

  it("prepara capo famiglia e familiare", async () => {
    const submission = await prepareBookingSubmission(
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 2,
        expectedGuests: 2,
        guests: [head, member],
      },
      resolver,
    );

    expect(submission.records).toHaveLength(2);
    expect(submission.records[0].slice(0, 2)).toBe("17");
    expect(submission.records[1].slice(0, 2)).toBe("19");
    expect(submission.records[0]).toHaveLength(168);
    expect(submission.records[1]).toHaveLength(168);
  });

  it("blocca il mismatch del numero ospiti", async () => {
    await expect(
      prepareBookingSubmission(
        {
          checkIn: new Date("2026-09-01T00:00:00.000Z"),
          nights: 2,
          expectedGuests: 2,
          guests: [head],
        },
        resolver,
      ),
    ).rejects.toThrow("GUEST_COUNT_MISMATCH");
  });

  it("blocca una struttura ospiti non valida", async () => {
    await expect(
      prepareBookingSubmission(
        {
          checkIn: new Date("2026-09-01T00:00:00.000Z"),
          nights: 1,
          expectedGuests: 2,
          guests: [
            {
              ...head,
              role: "SINGLE_GUEST",
            },
            member,
          ],
        },
        resolver,
      ),
    ).rejects.toThrow("INVALID_GUEST_STRUCTURE");
  });

  it("preserva apartmentId nella submission", async () => {
    const submission = await prepareBookingSubmission(
      {
        checkIn: new Date("2026-09-01T00:00:00.000Z"),
        nights: 2,
        expectedGuests: 2,
        guests: [head, member],
        apartmentId: "APT-123",
      },
      resolver,
    );

    expect(submission.apartmentId).toBe("APT-123");
  });
});
