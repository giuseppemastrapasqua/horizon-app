import type { buildOwnerCharts } from "@/lib/owners/dashboard-charts";
type Data = ReturnType<typeof buildOwnerCharts>;
const money = (value: number, currency: string) => new Intl.NumberFormat("it-IT", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
const channels: Record<string, string> = { BOOKING: "Booking.com", AIRBNB: "Airbnb", DIRECT: "Dirette", VRBO: "Vrbo", OTHER: "Altro" };
function Bars({ title, note, rows, format, scale }: { title: string; note: string; rows: { label: string; value: number | null; detail?: string }[]; format: (value: number) => string; scale?: number }) {
  const max = scale ?? Math.max(1, ...rows.map(row => Math.abs(row.value ?? 0)));
  return <section className="min-w-0 rounded-2xl border border-white/10 bg-[#09131C] p-5">
    <h3 className="text-lg font-semibold text-white">{title}</h3><p className="mt-2 text-xs leading-5 text-white/60">{note}</p>
    <ul className="mt-5 space-y-3">{rows.map(row => <li key={row.label} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 text-xs">
      <span className="text-white/70">{row.label}</span><span className="h-2 overflow-hidden rounded-full bg-white/5" aria-hidden="true"><span className={`block h-full rounded-full ${row.value !== null && row.value < 0 ? "bg-rose-400" : "bg-[#D8B367]"}`} style={{ width: `${Math.abs(row.value ?? 0) / max * 100}%` }} /></span>
      <span className="max-w-36 text-right tabular-nums text-white" title={row.detail}>{row.value === null ? "Non disponibile" : format(row.value)}{row.detail ? <span className="block text-[10px] text-white/50">{row.detail}</span> : null}</span>
    </li>)}</ul>{!rows.length ? <p className="mt-5 text-sm text-white/60">Nessun dato disponibile.</p> : null}
  </section>;
}
export function OwnerCharts({ data }: { data: Data }) {
  return <section className="min-w-0 space-y-4" aria-label="Grafici del portfolio">
    <div><h2 className="text-2xl text-white">Il tuo portfolio in cifre</h2><p className="mt-2 text-sm leading-6 text-white/60">Ultimi 12 mesi, incluso il mese corrente con soggiorni programmati. Dati registrati in Horizon: eventuali prenotazioni mancanti nei collegamenti non sono conteggiate.</p></div>
    <div className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Bars title="Occupazione registrata" note="Notti occupate / notti calendario degli alloggi attualmente associati. Check-out escluso; blocchi iCal senza prenotazione esclusi. Non misura la disponibilità vendibile." rows={data.occupancy.map(row => ({ ...row, detail: `${row.nights} notti` }))} format={value => `${value.toFixed(1)}%`} scale={100} />
      <Bars title="Notti prenotate" note="Notti effettivamente comprese nel mese, ripartite tra i mesi per i soggiorni a cavallo. Sovrapposizioni nello stesso alloggio contate una volta." rows={data.occupancy.map(row => ({ label: row.label, value: row.nights }))} format={value => String(value)} />
    </div>
    {data.financial.map(group => <div key={group.currency} className="grid min-w-0 gap-4 lg:grid-cols-2">
      <Bars title={`Ricavi lordi · ${group.currency}`} note="Prenotazioni attribuite al mese di check-out, senza dedurre commissioni, pulizie o imposte. Non rappresentano bonifici ricevuti." rows={group.months.map(row => ({ label: row.label, value: row.gross }))} format={value => money(value, group.currency)} />
      <Bars title={`Netto rendicontato · ${group.currency}`} note="Importi finali e rettifiche dei rendiconti salvati. Ogni mese può avere rendiconti solo per parte degli alloggi; non è una conferma di pagamento." rows={group.months.map(row => ({ label: row.label, value: row.net, detail: row.reportCount ? `${row.reportCount} rendiconti` : undefined }))} format={value => money(value, group.currency)} />
      <Bars title={`Prezzo medio per notte · ${group.currency}`} note="Lordo / notti delle prenotazioni con check-out nel mese. Include le componenti comprese nell’importo registrato, anche le pulizie." rows={group.months.map(row => ({ label: row.label, value: row.adr }))} format={value => money(value, group.currency)} />
      <Bars title={`Ricavi per portale · ${group.currency}`} note="Lordo delle prenotazioni con check-out negli ultimi 12 mesi. Le valute sono tenute separate." rows={group.channels.map(row => ({ ...row, label: channels[row.label] ?? row.label }))} format={value => money(value, group.currency)} />
    </div>)}
  </section>;
}
