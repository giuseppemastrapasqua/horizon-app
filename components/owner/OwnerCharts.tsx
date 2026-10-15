import type { buildOwnerCharts } from "@/lib/owners/dashboard-charts";
import { OwnerLineChart, OwnerColumnChart, ChartCard } from "./charts/OwnerChartPrimitives";
import { OwnerChannelDonut } from "./charts/OwnerChannelDonut";
type Data = ReturnType<typeof buildOwnerCharts>;
const money = (value: number, currency: string) => new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(value);
export function OwnerCharts({ data }: { data: Data }) {
  return <section className="min-w-0 space-y-5" aria-label="Grafici del portfolio">
    <header className="flex flex-wrap items-end justify-between gap-4 px-1 pt-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D8B367]">Horizon · Portfolio insights</p><h2 className="mt-2 text-2xl font-medium tracking-tight text-[#FFF8EA] sm:text-3xl">Una prospettiva sui tuoi risultati.</h2></div>
      <span className="rounded-full border border-[#D8B367]/20 bg-[#D8B367]/5 px-4 py-2 text-xs text-[#D8B367]">Ultimi 12 mesi · mese corrente incluso</span>
    </header>
    {data.financial.map((group, index) => {
      const gross = group.months.reduce((sum, month) => sum + month.gross, 0);
      const net = group.months.reduce((sum, month) => sum + (month.net ?? 0), 0);
      return <div key={group.currency} className="grid min-w-0 gap-5 xl:grid-cols-3">
        <ChartCard className="xl:col-span-2" eyebrow="Andamento economico" title="Il valore dei tuoi soggiorni" note="Lordo nel mese di check-out. Netto dai rendiconti salvati, comprese le rettifiche: può coprire solo parte degli alloggi. Le interruzioni indicano mesi senza rendiconto; non è una conferma di pagamento.">
          <div className="mb-4 mt-5 flex flex-wrap gap-x-10 gap-y-4"><Metric label={`Lordo prenotazioni · ${group.currency}`} value={money(gross, group.currency)} /><Metric label="Netto rendicontato" value={group.months.some(m => m.net !== null) ? money(net, group.currency) : "Non disponibile"} muted /></div>
          <OwnerLineChart id={`owner-economic-${index}`} labels={group.months.map(m => m.label)} series={[{ name: "Ricavi lordi", color: "#D8B367", values: group.months.map(m => m.gross) }, { name: "Netto rendicontato", color: "#8ABCB1", values: group.months.map(m => m.net) }]} format={v => money(v, group.currency)} />
        </ChartCard>
        <OwnerChannelDonut data={group.channels} currency={group.currency} />
        <ChartCard eyebrow="Tariffa media" title="Il prezzo di una notte" note="Lordo / notti delle prenotazioni con check-out nel mese, incluse le pulizie se comprese nell’importo. Mesi senza soggiorni lasciati vuoti.">
          <OwnerLineChart id={`owner-adr-${index}`} labels={group.months.map(m => m.label)} series={[{ name: "Prezzo medio", color: "#D8B367", values: group.months.map(m => m.adr) }]} format={v => money(v, group.currency)} />
        </ChartCard>
        {index === 0 ? <OccupancyCharts data={data} /> : null}
      </div>;
    })}
    {!data.financial.length ? <div className="grid gap-5 lg:grid-cols-2"><OccupancyCharts data={data} /></div> : null}
    <p className="px-1 text-xs leading-6 text-white/45">Dati registrati in Horizon, per gli alloggi attualmente associati. Il mese corrente include soggiorni programmati. Le prenotazioni mancanti nei collegamenti non sono conteggiate; le valute restano separate.</p>
  </section>;
}
function Metric({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return <div><p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</p><p className={`mt-2 text-2xl font-medium tabular-nums tracking-tight sm:text-3xl ${muted ? "text-[#8ABCB1]" : "text-[#FFF8EA]"}`}>{value}</p></div>;
}
function OccupancyCharts({ data }: { data: Data }) {
  return <>
    <ChartCard eyebrow="Presenza" title="Occupazione registrata" note="Notti occupate / notti calendario. Check-out e blocchi iCal senza prenotazione esclusi. Non misura la disponibilità vendibile.">
      <div className="mt-5 flex items-baseline gap-2"><span className="text-3xl font-medium tabular-nums text-[#FFF8EA]">{(data.occupancy.at(-1)?.value ?? 0).toFixed(1)}<span className="text-lg text-[#D8B367]">%</span></span><span className="text-xs text-white/45">mese corrente</span></div>
      <OwnerColumnChart labels={data.occupancy.map(m => m.label)} values={data.occupancy.map(m => m.value)} />
    </ChartCard>
    <ChartCard eyebrow="Soggiorni" title="Le notti del tuo portfolio" note="Notti ripartite nel mese di soggiorno, check-out escluso. Sovrapposizioni nello stesso alloggio contate una volta.">
      <div className="mt-5 flex items-baseline gap-2"><span className="text-3xl font-medium tabular-nums text-[#FFF8EA]">{data.occupancy.reduce((sum, m) => sum + m.nights, 0)}</span><span className="text-xs text-white/45">notti registrate</span></div>
      <OwnerLineChart id="owner-nights" labels={data.occupancy.map(m => m.label)} series={[{ name: "Notti", color: "#8ABCB1", values: data.occupancy.map(m => m.nights) }]} format={v => String(v)} />
    </ChartCard>
  </>;
}
