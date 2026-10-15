import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { loadMonthlyTaxReport } from "@/lib/tourist-tax/load-monthly-report";
import { TaxPropertyReport } from "./TaxPropertyReport";
const text = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
export default async function TouristTaxReportPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const year = text(params.year) ? Number(text(params.year)) : new Date().getUTCFullYear();
  const propertyId = text(params.propertyId) || undefined;
  const { properties, reports } = await loadMonthlyTaxReport(year, propertyId);
  return <><Navigation /><AppShell title="Tassa di soggiorno per alloggio" subtitle="Riepilogo mensile dei pernottamenti e dell’imposta · solo consultazione.">
    <form method="get" className="mb-5 flex flex-wrap items-end gap-4">
      <label className="min-w-0 max-w-full text-sm">Alloggio<select className="mt-2 block w-full max-w-full rounded-xl bg-[#152330] p-3" name="propertyId" defaultValue={propertyId ?? ""}><option value="">Tutti gli alloggi autorizzati</option>{properties.map((property) => <option value={property.id} key={property.id}>{property.name}</option>)}</select></label>
      <label className="text-sm">Anno<input type="number" min="2020" max="2100" name="year" defaultValue={year} required className="mt-2 block w-28 rounded-xl bg-[#152330] p-3" /></label>
      <button className="rounded-xl border border-[#D8B367]/40 px-5 py-3">Mostra</button>
    </form>
    <div className="mb-5 space-y-3 rounded-2xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm leading-6">
      <p>I soggiorni a cavallo sono ripartiti per notte nel mese corrispondente, con check-out escluso e tetto applicato al soggiorno intero. I soggiorni futuri sono previsioni. Questo prospetto non registra versamenti già effettuati al Comune e non è un saldo residuo da pagare.</p>
      <p>Calcolo automatico disponibile per Milano, locazioni brevi, 2026: 9,50 € per persona/notte, fino a 14 notti consecutive. Altri comuni, anni, importi particolari o classificazioni incomplete richiedono verifica. Eventuali soggiorni consecutivi suddivisi in più prenotazioni devono essere riconciliati.</p>
      <p>Per Milano il riepilogo è mensile; il riversamento è trimestrale. Le righe classificate come gestite da un portale sono separate: non vengono sottratte in base al solo nome Booking o Airbnb.</p>
      <p><a className="text-[#D8B367] underline" href="https://www.comune.milano.it/argomenti/tributi/imposta-di-soggiorno-informazioni" target="_blank" rel="noreferrer">Regole e tariffe del Comune di Milano</a></p>
    </div>
    <div className="space-y-6">{reports.map((report) => <TaxPropertyReport report={report} key={report.id} year={year} />)}</div>
    {!reports.length ? <p>Nessun alloggio autorizzato disponibile.</p> : null}
    <p className="mt-5 text-sm text-white/60">Per completare i dati fiscali apri la relativa <Link className="text-[#D8B367]" href="/bookings">prenotazione</Link>. Gli importi già incassati dall’ospite non equivalgono a versamenti effettuati al Comune.</p>
  </AppShell></>;
}
