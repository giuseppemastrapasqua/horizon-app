import { notFound } from "next/navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { buildMonthlyTaxReport } from "./build-monthly-report";
export async function loadMonthlyTaxReport(year: number, propertyId?: string) {
  const user = await requireRoles(["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"]);
  if (!Number.isInteger(year) || year < 2020 || year > 2100) notFound();
  const ids = await getAccessiblePropertyIds();
  const properties = await prisma.property.findMany({
    where: { ...(ids === null ? {} : { id: { in: ids } }), ...(user.role === "SUPER_ADMIN" ? {} : { accesses: { some: { userId: user.id, active: true, role: { in: ["MANAGER", "FINANCE"] } } } }) },
    select: { id: true, name: true, city: true }, orderBy: { name: "asc" },
  });
  if (propertyId && !properties.some((item) => item.id === propertyId)) notFound();
  const selected = properties.filter((item) => !propertyId || item.id === propertyId);
  const bookings = await prisma.booking.findMany({
    where: { propertyId: { in: selected.map((item) => item.id) }, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] }, checkIn: { lt: new Date(Date.UTC(year + 1, 0, 1)) }, checkOut: { gt: new Date(Date.UTC(year, 0, 1)) } },
    select: { id: true, propertyId: true, checkIn: true, checkOut: true, guests: true, channel: true, bookingGuests: { select: { soggiorniamoFiscalClassification: { select: { status: true, guestTypeCode: true, tariff: true, taxAmount: true, intermediary: true } } } } }, orderBy: { checkIn: "asc" },
  });
  const reports = buildMonthlyTaxReport(year, selected, bookings.map((booking) => ({ ...booking, classifications: booking.bookingGuests.map(({ soggiorniamoFiscalClassification: item }) => item ? { ...item, tariff: item.tariff === null ? null : Number(item.tariff), taxAmount: item.taxAmount === null ? null : Number(item.taxAmount) } : null) })));
  return { properties, reports };
}
