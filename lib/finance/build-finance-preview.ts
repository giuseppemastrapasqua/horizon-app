import { calculatePropertyFinanceFormula } from "@/lib/finance/calculate-property-finance-formula";
import { findFinanceFormulaForProperty } from "@/lib/finance/find-finance-formula";
import { prisma } from "@/lib/prisma";

type BuildFinancePreviewInput = {
  propertyId: string;
  referenceMonth: Date;
};

export async function buildFinancePreview({
  propertyId,
  referenceMonth,
}: BuildFinancePreviewInput) {
  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "L'identificativo dell'immobile è obbligatorio."
    );
  }

  const monthStart =
    normalizeReferenceMonth(
      referenceMonth
    );

  const nextMonthStart = new Date(
    Date.UTC(
      monthStart.getUTCFullYear(),
      monthStart.getUTCMonth() + 1,
      1
    )
  );

  const property =
    await prisma.property.findUnique({
      where: {
        id: normalizedPropertyId,
      },

      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        zone: true,

        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        bookings: {
          where: {
            bookingStatus: {
              not: "CANCELLED",
            },

            checkIn: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },

          orderBy: {
            checkIn: "asc",
          },

          select: {
            id: true,
            guestName: true,
            channel: true,
            checkIn: true,
            checkOut: true,
            nights: true,
            grossAmount: true,
            currency: true,
            bookingStatus: true,
          },
        },
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato."
    );
  }

  const formula =
    await findFinanceFormulaForProperty(
      property.id
    );

  const grossRevenue =
    property.bookings.reduce(
      (total, booking) =>
        total +
        Number(booking.grossAmount),
      0
    );

  const totalNights =
    property.bookings.reduce(
      (total, booking) =>
        total + booking.nights,
      0
    );

  const currency =
    property.bookings[0]?.currency ??
    "EUR";

 const calculation = formula
  ? await calculatePropertyFinanceFormula({
      formulaId: formula.id,
      grossRevenue,
      bookingCount:
        property.bookings.length,
      currency,
    })
  : null;

  return {
    property,
    owner: property.owner,
    bookings: property.bookings,
    formula,
    referenceMonth: monthStart,
    nextMonthStart,
    grossRevenue,
    totalNights,
    currency,
    calculation,
  };
}

function normalizeReferenceMonth(
  value: Date
) {
  if (
    Number.isNaN(value.getTime())
  ) {
    throw new Error(
      "Il mese di riferimento non è valido."
    );
  }

  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      1
    )
  );
}

export type FinancePreview =
  Awaited<
    ReturnType<
      typeof buildFinancePreview
    >
  >;