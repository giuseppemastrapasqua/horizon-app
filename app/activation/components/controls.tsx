import type { ReactNode } from "react";

export const fieldClass = "mt-2 w-full rounded-lg border border-white/15 bg-[#1b1e20] px-3 py-2.5 text-sm text-[#FFF8EA] focus:outline-none focus:ring-2 focus:ring-[#D8B367]/60";
export const goldButton = "rounded-lg bg-[#D8B367] px-5 py-3 text-sm font-semibold text-[#171819] disabled:opacity-50";
export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-white/15 bg-white/[0.025] p-5 ${className}`}>{title && <h2 className="mb-4 font-serif text-xl text-[#FFF8EA]">{title}</h2>}{children}</section>;
}
export function TextField({ label, value, onChange, multiline = false, type = "text" }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; type?: string }) {
  return <label className="block text-sm text-slate-300">{label}{multiline ? <textarea rows={4} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} /> : <input type={type} className={fieldClass} value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}
export function NumberField({ label, value, onChange, integer = false, max }: { label: string; value: number | null; onChange: (value: number | null) => void; integer?: boolean; max?: number }) {
  return <label className="block text-sm text-slate-300">{label}<input type="number" min={0} max={max} step={integer ? 1 : "0.01"} className={fieldClass} value={value ?? ""} placeholder="Da impostare" onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} /></label>;
}
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-start gap-3 text-sm leading-6 text-slate-300"><input className="mt-1 accent-[#D8B367]" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
export const euro = (value: number | null | undefined) => value === null || value === undefined ? "Da impostare" : new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
