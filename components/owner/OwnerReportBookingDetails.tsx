import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ownerBookingLabel } from "@/lib/owners/portal-policy";
import { buildBookingAccountingPeriodWhere } from "@/lib/finance/preview/booking-accounting-period";
import type { readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
const money = (value: number | null, currency: string) => value === null ? "Non disponibile" : new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value);
const date = (value: Date) => value.toLocaleDateString("it-IT", { timeZone: "UTC" });
export async function OwnerReportBookingDetails({ propertyId, month, currency, grossRevenue, saved }: {
  propertyId: string; month: Date; currency: string; grossRevenue: number; saved: ReturnType<typeof readReportBookingSnapshot>;
}) {
  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
  const bookings = saved ?? await prisma.booking.findMany({
    where: { propertyId, bookingStatus: { not: "CANCELLED" }, ...buildBookingAccountingPeriodWhere({ monthStart, nextMonthStart }) },
    select: { id: true, checkIn: true, checkOut: true, nights: true, guests: true, channel: true, currency: true, grossAmount: true },
    orderBy: [{ checkIn: "asc" }, { id: "asc" }],
  });
  const allSameCurrency = bookings.every((booking) => booking.currency === currency);
  const grossCents = bookings.reduce((sum, booking) => sum + Math.round(Number(booking.grossAmount) * 100), 0);
  const difference = grossCents - Math.round(grossRevenue * 100);
  return <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
    <h2 className="text-xl">{saved ? "Dettaglio salvato delle prenotazioni" : "Prenotazioni del periodo · dati attuali"}</h2>
    <p className="mt-2 text-sm text-white/65">{saved ? "Date, importi e calcoli conservati alla creazione del rendiconto." : "Questo rendiconto storico non contiene le singole prenotazioni salvate. L’elenco usa i dati attuali e la regola di periodo esistente: check-out per Booking, check-in per gli altri canali. Non certifica la composizione originaria e non ricalcola il rendiconto."}</p>
    {!saved ? <p className="mt-3 text-sm text-amber-200">{allSameCurrency ? `Lordo dell’elenco attuale: ${money(grossCents / 100, currency)}. ${difference === 0 ? "Coincide con il totale salvato; le singole righe storiche non sono comunque verificabili." : `Differenza dal lordo salvato: ${money(difference / 100, currency)}.`}` : "L’elenco contiene valute diverse: confronto con il totale salvato non disponibile."}</p> : null}
    <div className="mt-4 space-y-3">{bookings.map((booking) => {
      const detail = saved?.find((item) => item.id === booking.id)?.breakdown;
      const costs = detail ? [["Commissioni OTA", detail.otaCommission], ["Pulizie", detail.cleaningCost], ["Gestione inclusa IVA", detail.managementCommissionTotal], ["Imposte", detail.taxAmount], ["Altri importi", detail.otherAmount], ["Netto proprietario", detail.netProperty]] as const : [];
      return <article className="min-w-0 rounded-xl border border-white/10 bg-[#07111A] p-4" key={booking.id}>
        <div className="flex flex-wrap justify-between gap-3"><Link className="font-semibold text-[#D8B367]" href={`/bookings/${booking.id}`}>{ownerBookingLabel(booking.id)}</Link><strong>{money(Number(booking.grossAmount), booking.currency)}</strong></div>
        <p className="mt-2 text-sm text-white/65">{date(booking.checkIn)} – {date(booking.checkOut)} · {booking.nights} notti · {booking.guests} ospiti · {booking.channel}</p>
        {detail ? <details className="mt-3 text-sm"><summary className="cursor-pointer text-[#D8B367]">Vedi calcolo salvato</summary><dl className="mt-3 space-y-2">{costs.map(([label, value]) => <div className="flex flex-wrap justify-between gap-2" key={label}><dt>{label}</dt><dd>{money(value, booking.currency)}</dd></div>)}</dl></details> : null}
      </article>;
    })}</div>
    {!bookings.length ? <p className="mt-4 text-white/60">Nessuna prenotazione disponibile per il periodo.</p> : null}
  </section>;
}
