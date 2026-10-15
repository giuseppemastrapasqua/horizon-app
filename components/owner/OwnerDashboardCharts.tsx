import { prisma } from "@/lib/prisma";
import { buildOwnerCharts, ownerChartWindow } from "@/lib/owners/dashboard-charts";
import { OwnerCharts } from "./OwnerCharts";

export async function OwnerDashboardCharts({ propertyIds, now }: { propertyIds: string[]; now: Date }) {
  if (!propertyIds.length) return null;
  const { from, to } = ownerChartWindow(now);
  const [bookings, reports] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId: { in: propertyIds }, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] }, checkIn: { lt: to }, checkOut: { gte: from } },
      select: { propertyId: true, checkIn: true, checkOut: true, nights: true, channel: true, currency: true, grossAmount: true },
    }),
    prisma.financeReport.findMany({
      where: { propertyId: { in: propertyIds }, referenceMonth: { gte: from, lt: to } },
      select: { referenceMonth: true, currency: true, finalAmount: true, adjustments: { select: { amount: true } } },
    }),
  ]);
  return <OwnerCharts data={buildOwnerCharts(propertyIds, bookings, reports, now)} />;
}
