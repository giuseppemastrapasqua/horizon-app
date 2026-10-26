import { z } from "zod";
import type { BookingFinanceBreakdown } from "@/lib/finance/calculations/build-booking-finance-breakdown";
import { ownerBookingLabel } from "@/lib/owners/portal-policy";

const number = z.number().finite();
const breakdownSchema = z.object({
  grossBooking: number,
  otaCommission: number.nullable(),
  cleaningCost: number,
  grossProperty: number,
  managementCommission: number.nullable(),
  managementCommissionTaxableBase: number,
  managementCommissionVat: number,
  managementCommissionTotal: number,
  taxAmount: number.nullable(),
  otherAmount: number.nullable(),
  netProperty: number,
});
const bookingSchema = z.object({
  id: z.string().min(1),
  externalBookingId: z.string().nullable().optional(),
  checkIn: z.string().datetime(),
  checkOut: z.string().datetime(),
  nights: z.number().int().nonnegative(),
  guests: z.number().int().nonnegative(),
  channel: z.enum(["BOOKING", "AIRBNB", "VRBO", "DIRECT", "OTHER"]),
  currency: z.string().length(3),
  breakdown: breakdownSchema,
});
const snapshotSchema = z.object({
  version: z.literal(1),
  bookings: z.array(bookingSchema),
});

type BookingInput = {
  id: string;
  externalBookingId?: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  channel: string;
  currency: string;
};

export function createReportBookingSnapshot(
  bookings: BookingInput[],
  breakdowns: BookingFinanceBreakdown[],
) {
  if (bookings.length !== breakdowns.length)
    throw new Error("Dettaglio del rendiconto incompleto.");
  return snapshotSchema.parse({
    version: 1,
    bookings: bookings.map((booking, index) => ({
      id: booking.id,
      externalBookingId: booking.externalBookingId ?? null,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: booking.nights,
      guests: booking.guests,
      channel: booking.channel,
      currency: booking.currency,
      breakdown: breakdowns[index],
    })),
  });
}

export function readReportBookingSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || !("bookingDetail" in value))
    return null;
  const result = snapshotSchema.safeParse(value.bookingDetail);
  if (!result.success)
    throw new Error("Dettaglio salvato del rendiconto non valido.");
  return result.data.bookings.map((booking) => ({
    ...booking,
    guestName: ownerBookingLabel(booking.id),
    checkIn: new Date(booking.checkIn),
    checkOut: new Date(booking.checkOut),
    grossAmount: booking.breakdown.grossBooking,
  }));
}
