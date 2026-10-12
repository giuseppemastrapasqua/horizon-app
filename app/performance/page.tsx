import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { monthlyPerformance } from "@/lib/finance/monthly-performance";
import { scopedPropertyFilter } from "@/lib/owners/portal-policy";

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; propertyId?: string }>;
}) {
  await requireRoles(["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN", "OWNER"]);
  const params = await searchParams;
  const now = new Date();
  const month = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(params.month ?? "");
  const start = month
    ? new Date(Date.UTC(Number(month[1]), Number(month[2]) - 1, 1))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const ids = await getAccessiblePropertyIds();
  const properties = await prisma.property.findMany({
    where: ids === null ? {} : { id: { in: ids } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const selectedProperties = params.propertyId
    ? properties.filter((property) => property.id === params.propertyId)
    : properties;
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: scopedPropertyFilter(
        selectedProperties.map((property) => property.id),
      ),
      bookingStatus: { not: "CANCELLED" },
      checkIn: { lt: end },
      checkOut: { gte: start },
    },
    select: {
      propertyId: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      grossAmount: true,
      currency: true,
      bookingStatus: true,
    },
  });
  const metrics = monthlyPerformance(
    selectedProperties.map((property) => property.id),
    bookings,
    start,
    end,
  );
  const occupancy = metrics.availableNights
    ? (metrics.occupiedNights / metrics.availableNights) * 100
    : 0;
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(
      value,
    );
  return (
    <>
      <Navigation />
      <AppShell
        title="Performance del mese"
        subtitle="Occupazione del portfolio attuale e ricavi riconosciuti nel mese di check-out."
      >
        <Link href="/dashboard">← Dashboard</Link>
        <form method="get" className="my-5 flex flex-wrap items-end gap-4">
          <label>
            Struttura
            <select
              name="propertyId"
              defaultValue={params.propertyId ?? ""}
              className="mt-2 block rounded-lg bg-[#152330] p-3"
            >
              <option value="">Tutte le strutture</option>
              {properties.map((property) => (
                <option value={property.id} key={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mese
            <input
              type="month"
              name="month"
              defaultValue={start.toISOString().slice(0, 7)}
              className="mt-2 block rounded-lg bg-[#152330] p-3"
            />
          </label>
          <button className="rounded-lg border border-white/20 px-4 py-3">
            Mostra
          </button>
        </form>
        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-white/10 p-5">
            <p className="text-sm text-white/60">Occupazione</p>
            <p className="mt-2 text-3xl">{occupancy.toFixed(1)}%</p>
            <p className="mt-2 text-sm text-white/60">
              {metrics.occupiedNights} notti occupate su{" "}
              {metrics.availableNights}
            </p>
          </section>
          {metrics.revenues.map((item) => (
            <section
              className="rounded-2xl border border-white/10 p-5"
              key={item.currency}
            >
              <p className="text-sm text-white/60">
                Ricavi lordi · {item.stays} soggiorni conclusi
              </p>
              <p className="mt-2 text-2xl">
                {money(item.gross, item.currency)}
              </p>
              <p className="mt-3 text-sm text-white/60">
                Ricavo lordo / notte:{" "}
                {money(
                  item.nights ? item.gross / item.nights : 0,
                  item.currency,
                )}
              </p>
            </section>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 p-5">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="pb-3">Giorno</th>
                <th>Strutture occupate</th>
                <th>Strutture libere</th>
              </tr>
            </thead>
            <tbody>
              {metrics.dailyOccupied.map((count, index) => (
                <tr className="border-t border-white/10" key={index}>
                  <td className="py-2">
                    {new Date(
                      start.getTime() + index * 86400000,
                    ).toLocaleDateString("it-IT", { timeZone: "UTC" })}
                  </td>
                  <td>{count}</td>
                  <td>{selectedProperties.length - count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-white/50">
          I blocchi di disponibilità non sono conteggiati come soggiorni. Il
          netto proprietario è consultabile nei rendiconti salvati.
        </p>
      </AppShell>
    </>
  );
}
