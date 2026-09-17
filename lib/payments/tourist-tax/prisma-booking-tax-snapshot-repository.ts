import type {
  BookingTaxSnapshot,
  BookingTaxSnapshotRepository,
} from "./booking-payment-service";

import { prisma } from "@/lib/prisma";

export class PrismaBookingTaxSnapshotRepository
  implements BookingTaxSnapshotRepository
{
  async findById(
    bookingId: string,
  ): Promise<BookingTaxSnapshot | null> {
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        bookingGuests: {
          select: {
            soggiorniamoFiscalClassification: {
              select: {
                status: true,
                taxAmount: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return null;
    }

    return {
      id: booking.id,
      guests: booking.bookingGuests.map((guest) => ({
        classification:
          guest.soggiorniamoFiscalClassification
            ? {
                status:
                  guest.soggiorniamoFiscalClassification.status,
                taxAmount:
                  guest.soggiorniamoFiscalClassification.taxAmount ===
                  null
                    ? null
                    : Number(
                        guest
                          .soggiorniamoFiscalClassification
                          .taxAmount,
                      ),
              }
            : null,
      })),
    };
  }
}
