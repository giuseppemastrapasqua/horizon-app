import {
  financePreviewPropertySelect,
  type FinancePreviewProperty,
} from "@/lib/finance/preview/preview-types";
import { prisma } from "@/lib/prisma";

type LoadPreviewPropertyInput = {
  propertyId: string;
  monthStart: Date;
  nextMonthStart: Date;
};

export async function loadPreviewProperty({
  propertyId,
  monthStart,
  nextMonthStart,
}: LoadPreviewPropertyInput): Promise<FinancePreviewProperty> {
  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },

      select: {
        ...financePreviewPropertySelect,

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

          select:
            financePreviewPropertySelect
              .bookings.select,
        },
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato."
    );
  }

  return property;
}