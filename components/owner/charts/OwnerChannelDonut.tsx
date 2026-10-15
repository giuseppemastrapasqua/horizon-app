import { ChartCard } from "./OwnerChartPrimitives";
const names: Record<string, string> = { BOOKING: "Booking.com", AIRBNB: "Airbnb", VRBO: "Vrbo", DIRECT: "Dirette", OTHER: "Altro" };
const colors = ["#D8B367", "#8ABCB1", "#7896B4", "#B39BC9", "#6D797F"];
export function OwnerChannelDonut({ data, currency }: { data: { label: string; value: number }[]; currency: string }) {
  const rows = data.filter(row => row.value > 0).toSorted((a, b) => b.value - a.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0), circumference = 2 * Math.PI * 76;
  const format = (v: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(v);
  return <ChartCard eyebrow="Distribuzione" title="Da dove arrivano i ricavi" note="Ricavi lordi per portale, attribuiti al mese di check-out negli ultimi 12 mesi. Solo prenotazioni registrate; nessun importo negativo incluso nell’anello.">
    <div className="mx-auto my-5 w-full max-w-[244px]"><svg viewBox="0 0 220 220" role="img" aria-label={`Ripartizione dei ricavi per portale, ${currency}`} className="h-auto w-full">
      <circle cx="110" cy="110" r="76" fill="none" stroke="white" strokeOpacity="0.045" strokeWidth="15" />
      {rows.map((row, i) => { const offset = rows.slice(0, i).reduce((sum, r) => sum + r.value, 0) / total * circumference; const length = row.value / total * circumference; return <circle key={row.label} cx="110" cy="110" r="76" fill="none" stroke={colors[i % colors.length]} strokeWidth="15" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 110 110)"><title>{`${names[row.label] ?? row.label}: ${format(row.value)} · ${(row.value / total * 100).toFixed(1)}%`}</title></circle>; })}
      <text x="110" y="103" textAnchor="middle" fill="#75838F" fontSize="9" letterSpacing="2">RICAVI LORDI</text><text x="110" y="127" textAnchor="middle" fill="#F4EFE4" fontSize="19" fontWeight="500">{new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 }).format(total)}</text><text x="110" y="146" textAnchor="middle" fill="#D8B367" fontSize="10">{currency}</text>
    </svg></div>
    <ul className="space-y-3">{rows.map((row, i) => <li className="flex items-center justify-between gap-3 text-xs" key={row.label}><span className="flex items-center gap-2 text-white/65"><span className="h-1.5 w-1.5 rounded-full" style={{ background: colors[i % colors.length] }} />{names[row.label] ?? row.label}</span><span className="text-right tabular-nums text-[#F4EFE4]">{(row.value / total * 100).toFixed(1)}%<span className="ml-2 text-[10px] text-white/40">{format(row.value)}</span></span></li>)}</ul>
    {!rows.length ? <p className="text-center text-xs text-white/50">Nessun ricavo disponibile.</p> : null}
  </ChartCard>;
}
