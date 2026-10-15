import Link from "next/link";
import type { buildMonthlyTaxReport } from "@/lib/tourist-tax/build-monthly-report";
const euro = (cents: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
export function TaxPropertyReport({ report, year }: { report: ReturnType<typeof buildMonthlyTaxReport>[number]; year: number }) {
  const total = report.months.reduce((sum, row) => sum + row.managerCents, 0);
  const review = report.months.reduce((sum, row) => sum + row.reviewGuestNights, 0);
  return <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0F172A] p-4 sm:p-5">
    <h2 className="text-xl font-semibold">{report.name}</h2>
    <p className="mt-2 text-sm text-white/65">{report.city} · {year} · Quota gestore calcolata: <strong className="text-[#D8B367]">{euro(total)}</strong>{review ? ` · Prospetto incompleto: ${review} presenze-notte da verificare` : " · Sui soli soggiorni registrati"}</p>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {report.months.map((row) => <article className="rounded-xl border border-white/10 bg-[#07111A] p-4" key={row.month}>
        <h3 className="font-semibold capitalize">{new Date(Date.UTC(year, row.month - 1, 1)).toLocaleDateString("it-IT", { month: "long", timeZone: "UTC" })}</h3>
        <p className="mt-2 text-xl text-[#D8B367]">{row.reviewGuestNights ? "Da completare" : euro(row.managerCents)}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2"><dt>Quota gestore calcolata</dt><dd>{euro(row.managerCents)}</dd></div>
          <div className="flex justify-between gap-2"><dt>Presenze-notte totali</dt><dd>{row.guestNights}</dd></div>
          <div className="flex justify-between gap-2"><dt>Imponibili gestore</dt><dd>{row.taxableGuestNights}</dd></div>
          <div className="flex justify-between gap-2"><dt>Esenti / escluse</dt><dd>{row.exemptGuestNights}</dd></div>
          <div className="flex justify-between gap-2"><dt>Gestite da portali</dt><dd>{row.portalGuestNights}</dd></div>
        </dl>
        {row.portalGuestNights ? <p className="mt-3 text-xs text-white/60">Importo portali registrato: {euro(row.portalCents)}. La classificazione non certifica il riversamento; zero non certifica imposta nulla.</p> : null}
        {row.reviewGuestNights ? <p className="mt-3 rounded-lg bg-amber-300/10 p-2 text-xs text-amber-200">{row.reviewGuestNights} presenze-notte da verificare.{row.estimateUnavailable ? " Stima non disponibile per tutti i casi." : ` Se tutte ordinarie, imposta aggiuntiva stimata ${euro(row.estimateCents)}: esenzioni e gestione portali ancora da verificare.`}</p> : null}
        {row.bookingIds.length ? <details className="mt-3 text-sm"><summary className="cursor-pointer text-[#D8B367]">Dettaglio soggiorni ({row.bookingIds.length})</summary><div className="mt-2 space-y-3">{report.details.filter((detail) => detail.month === row.month).map((detail) => <div className="border-t border-white/10 pt-2" key={detail.bookingId}><Link href={`/bookings/${detail.bookingId}`} className="text-[#D8B367]">Prenotazione {detail.bookingId.slice(-8)}</Link><p className="text-xs text-white/65">{detail.channel} · {detail.nights} notti nel mese · {detail.expectedGuests} ospiti · quota gestore {euro(detail.managerCents)}{detail.reviewGuestNights ? " · da verificare" : ""}</p></div>)}</div></details> : <p className="mt-3 text-xs text-white/50">Nessun soggiorno registrato nel mese.</p>}
      </article>)}
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((quarter) => {
      const months = report.months.slice(quarter * 3, quarter * 3 + 3);
      return <div className="rounded-xl border border-[#D8B367]/20 p-3 text-sm" key={quarter}><p>{quarter + 1}º trimestre · quota gestore</p><strong>{euro(months.reduce((sum, month) => sum + month.managerCents, 0))}</strong>{months.some((month) => month.reviewGuestNights) ? <p className="text-amber-200">Totale parziale</p> : null}</div>;
    })}</div>
  </section>;
}
