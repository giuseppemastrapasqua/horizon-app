import { notFound } from "next/navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function getCleaningReport(month?: string, propertyId?: string) {
  await requireRoles(["SUPER_ADMIN", "MANAGER", "OPERATOR"]);
  const ids = await getAccessiblePropertyIds();
  const now = new Date();
  const value = month ?? now.toISOString().slice(0, 7);
  if (!/^20\d{2}-(0[1-9]|1[0-2])$/.test(value)) notFound();
  const start = new Date(`${value}-01T00:00:00Z`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const properties = await prisma.property.findMany({
    where: ids === null ? {} : { id: { in: ids } },
    select: { id: true, name: true, cleaningCost: true },
    orderBy: { name: "asc" },
  });
  if (propertyId && !properties.some((property) => property.id === propertyId)) notFound();
  const selected = properties.filter((property) => !propertyId || property.id === propertyId);
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: { in: selected.map((property) => property.id) },
      checkOut: { gte: start, lt: end },
      bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
    },
    select: { id: true, propertyId: true, checkIn: true, checkOut: true },
    orderBy: [{ checkOut: "asc" }, { id: "asc" }],
  });
  const rows = bookings.map((booking) => {
    const property = selected.find((item) => item.id === booking.propertyId)!;
    return { ...booking, propertyName: property.name, cents: Math.round(Number(property.cleaningCost) * 100) };
  });
  return { month: value, properties, rows, totalCents: rows.reduce((sum, row) => sum + row.cents, 0) };
}
