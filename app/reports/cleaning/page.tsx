import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getCleaningReport } from "@/lib/cleaning/get-cleaning-report";

const euro = (cents: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
const date = (value: Date) => value.toLocaleDateString("it-IT", { timeZone: "UTC" });

export default async function CleaningReportPage({ searchParams }: {
  searchParams: Promise<{ month?: string; propertyId?: string }>;
}) {
  const params = await searchParams;
  const report = await getCleaningReport(params.month, params.propertyId);
  return <>
    <Navigation />
    <AppShell title="Rendiconto pulizie" subtitle="Un intervento per soggiorno, nel mese di check-out.">
      <form method="get" className="mb-5 flex flex-wrap items-end gap-4">
        <label className="min-w-0 max-w-full text-sm">Alloggio
          <select name="propertyId" defaultValue={params.propertyId ?? ""} className="mt-2 block w-full max-w-full rounded-xl bg-[#152330] p-3">
            <option value="">Tutti gli alloggi assegnati</option>
            {report.properties.map((property) => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Mese di check-out
          <input type="month" name="month" defaultValue={report.month} required className="mt-2 block rounded-xl bg-[#152330] p-3" />
        </label>
        <button className="rounded-xl border border-[#D8B367]/40 px-5 py-3">Mostra</button>
      </form>
      <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
        <p>{report.rows.length} pulizie · Totale previsto</p>
        <p className="mt-2 text-3xl text-[#D8B367]">{euro(report.totalCents)}</p>
        <p className="mt-3 text-sm text-white/60">Costo pulizia attualmente configurato per ciascun alloggio. Sono inclusi i soggiorni confermati, in corso e conclusi; esclusi quelli annullati o in attesa. Il totale non certifica l’esecuzione o il pagamento delle pulizie.</p>
      </section>
      <div className="space-y-3">
        {report.rows.map((row) => <article key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 p-4">
          <div className="min-w-0">
            <Link className="break-words font-semibold" href={`/bookings/${row.id}`}>{row.propertyName}</Link>
            <p className="mt-1 text-sm text-white/60">{date(row.checkIn)} – {date(row.checkOut)}</p>
            <p className="text-xs text-white/60">Riferimento {row.id.slice(-8)}</p>
          </div>
          <p className="font-semibold text-[#D8B367]">{euro(row.cents)}</p>
        </article>)}
        {!report.rows.length && <p className="text-white/60">Nessuna pulizia prevista nel periodo selezionato.</p>}
      </div>
    </AppShell>
  </>;
}
