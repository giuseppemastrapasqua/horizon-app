import type { ReactNode } from "react";
type Series = { name: string; color: string; values: (number | null)[] };
const W = 640, H = 230, L = 48, R = 16, T = 20, B = 36;
export function ChartCard({ eyebrow, title, note, className = "", children }: { eyebrow: string; title: string; note: string; className?: string; children: ReactNode }) {
  return <article className={`relative min-w-0 overflow-hidden rounded-[24px] border border-white/[0.075] bg-gradient-to-br from-[#10202A] via-[#0B1720] to-[#081219] p-5 shadow-[0_16px_48px_rgba(0,0,0,0.12)] sm:p-6 ${className}`}>
    <div className="pointer-events-none absolute -right-12 -top-20 h-48 w-48 rounded-full bg-[#D8B367]/[0.035] blur-3xl" aria-hidden="true" />
    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D8B367]">{eyebrow}</p><h3 className="mt-2 text-lg font-medium tracking-tight text-[#F4EFE4]">{title}</h3>
    {children}
    <details className="mt-4 border-t border-white/[0.06] pt-3 text-[11px] leading-5 text-white/45"><summary className="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D8B367]">Come leggere il grafico</summary><p className="mt-2">{note}</p></details>
  </article>;
}
function curve(points: { x: number; y: number }[]) {
  return points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `C ${(points[i - 1].x + p.x) / 2} ${points[i - 1].y}, ${(points[i - 1].x + p.x) / 2} ${p.y}, ${p.x} ${p.y}`).join(" ");
}
export function OwnerLineChart({ id, labels, series, format }: { id: string; labels: string[]; series: Series[]; format: (value: number) => string }) {
  const values = series.flatMap(s => s.values.filter((v): v is number => v !== null));
  const low = Math.min(0, ...values), high = Math.max(1, ...values);
  const x = (i: number) => L + i / Math.max(1, labels.length - 1) * (W - L - R);
  const y = (v: number) => H - B - (v - low) / (high - low) * (H - T - B);
  return <div className="mt-4 min-w-0">
    <div className="mb-2 flex flex-wrap gap-x-5 gap-y-2">{series.map(s => <span key={s.name} className="flex items-center gap-2 text-[10px] text-white/55"><span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />{s.name}</span>)}</div>
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full overflow-visible" role="img" aria-label={`${series.map(s => s.name).join(" e ")}, andamento mensile`}>
      <defs>{series.map((s, i) => <linearGradient key={s.name} id={`${id}-${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={s.color} stopOpacity="0.17" /><stop offset="100%" stopColor={s.color} stopOpacity="0" /></linearGradient>)}</defs>
      {[0, 0.5, 1].map(t => <g key={t}><line x1={L} x2={W - R} y1={y(low + t * (high - low))} y2={y(low + t * (high - low))} stroke="#FFFFFF" strokeOpacity="0.065" strokeDasharray="3 6" /><text x={L - 10} y={y(low + t * (high - low)) + 3} textAnchor="end" fill="#70808D" fontSize="9">{new Intl.NumberFormat("it-IT", { notation: "compact", maximumFractionDigits: 1 }).format(low + t * (high - low))}</text></g>)}
      {series.map((s, si) => {
        const segments: { x: number; y: number }[][] = [];
        s.values.forEach((v, i) => { if (v === null) return; if (i === 0 || s.values[i - 1] === null) segments.push([]); segments.at(-1)!.push({ x: x(i), y: y(v) }); });
        return <g key={s.name}>{segments.map((points, i) => <g key={i}>{points.length > 1 ? <><path d={`${curve(points)} L ${points.at(-1)!.x} ${y(0)} L ${points[0].x} ${y(0)} Z`} fill={`url(#${id}-${si})`} /><path d={curve(points)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" /></> : null}</g>)}{s.values.map((v, i) => v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#0B1720" stroke={s.color} strokeWidth="1.8"><title>{`${labels[i]} · ${s.name}: ${format(v)}`}</title></circle>)}</g>;
      })}
      {labels.map((label, i) => i % 2 === 0 || i === labels.length - 1 ? <text key={label} x={x(i)} y={H - 10} textAnchor="middle" fill="#70808D" fontSize="9">{label}</text> : null)}
    </svg><ChartData labels={labels} series={series} format={format} />
  </div>;
}
export function OwnerColumnChart({ labels, values }: { labels: string[]; values: number[] }) {
  const width = (W - L - R) / Math.max(1, values.length);
  return <div className="mt-4"><svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Occupazione mensile, scala da zero a cento percento">
    {[0, 50, 100].map(v => <g key={v}><line x1={L} x2={W - R} y1={H - B - v / 100 * (H - T - B)} y2={H - B - v / 100 * (H - T - B)} stroke="white" strokeOpacity="0.065" strokeDasharray="3 6" /><text x={L - 10} y={H - B - v / 100 * (H - T - B) + 3} textAnchor="end" fill="#70808D" fontSize="9">{v}%</text></g>)}
    {values.map((v, i) => <g key={labels[i]}><rect x={L + i * width + width * 0.22} y={T} width={width * 0.56} height={H - B - T} rx="4" fill="white" fillOpacity="0.025" /><rect x={L + i * width + width * 0.22} y={H - B - v / 100 * (H - T - B)} width={width * 0.56} height={v / 100 * (H - T - B)} rx="4" fill={i === values.length - 1 ? "#E8CA8E" : "#D8B367"} fillOpacity={i === values.length - 1 ? 1 : 0.55}><title>{`${labels[i]}: ${v.toFixed(1)}%`}</title></rect>{i % 2 === 0 || i === labels.length - 1 ? <text x={L + (i + 0.5) * width} y={H - 10} textAnchor="middle" fill="#70808D" fontSize="9">{labels[i]}</text> : null}</g>)}
    </svg><ChartData labels={labels} series={[{ name: "Occupazione", color: "#D8B367", values }]} format={v => `${v.toFixed(1)}%`} /></div>;
}
function ChartData({ labels, series, format }: { labels: string[]; series: Series[]; format: (value: number) => string }) {
  return <details className="mt-2 text-[11px] text-white/45"><summary className="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D8B367]">Vedi valori mensili</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left tabular-nums"><thead><tr><th className="py-2 font-medium">Mese</th>{series.map(s => <th className="px-2 py-2 font-medium" key={s.name}>{s.name}</th>)}</tr></thead><tbody>{labels.map((label, i) => <tr className="border-t border-white/5" key={label}><td className="py-2">{label}</td>{series.map(s => <td className="px-2 py-2" key={s.name}>{s.values[i] === null ? "Non disponibile" : format(s.values[i])}</td>)}</tr>)}</tbody></table></div></details>;
}
