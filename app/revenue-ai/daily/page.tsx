import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { buildDailyAdvice } from "@/lib/revenue/daily/build-daily-advice";
import { loadDailyWorkspace } from "@/lib/revenue/daily/load-daily-workspace";
import { DailyAdviceResults } from "./DailyAdviceResults";

const inputClass = "mt-2 block w-full min-w-0 rounded-xl border border-white/15 bg-[#152330] p-3 text-[#FFF8EA]";
const text = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const amount = (value: string, fallback: number | null) => value.trim() === "" ? fallback : Number(value);
function dateValue(value: string, fallback: string) {
  const key = value || fallback;
  const date = new Date(`${key}T00:00:00Z`);
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(key) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== key) return null;
  return date;
}
export default async function DailyRevenuePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const from = dateValue(text(params.from), today);
  const to = dateValue(text(params.to), new Date(now.getTime() + 13 * 86400000).toISOString().slice(0, 10));
  if (!from || !to || to < from || to.getTime() - from.getTime() > 92 * 86400000) {
    // Authorization remains mandatory even for malformed requests.
    await loadDailyWorkspace(text(params.propertyId) || undefined, new Date(`${today}T00:00:00Z`), new Date(`${today}T00:00:00Z`));
    return <><Navigation /><AppShell title="Prezzi consigliati"><p>Seleziona date valide, fino a 93 notti.</p><Link href="/revenue-ai/daily">Reimposta periodo</Link></AppShell></>;
  }
  const data = await loadDailyWorkspace(text(params.propertyId) || undefined, from, to);
  const property = data.selected;
  if (!property) return <><Navigation /><AppShell title="Prezzi consigliati"><p>Nessun alloggio assegnato.</p></AppShell></>;
  const rate = property.ratePlans.find((plan) => plan.code === "STANDARD") ?? property.ratePlans[0];
  const base = amount(text(params.base), rate?.occupancyIncluded === 2 ? Number(rate.basePrice) : null);
  const extra = amount(text(params.extra), Number(property.extraGuestFee))!;
  const cleaning = amount(text(params.cleaning), Number(property.cleaningCost))!;
  const floor = amount(text(params.floor), null);
  const ceiling = amount(text(params.ceiling), null);
  const guests = amount(text(params.guests), Math.min(2, property.maxGuests))!;
  let rows: ReturnType<typeof buildDailyAdvice> = [];
  let error = "";
  try {
    if (!Number.isFinite(cleaning) || cleaning < 0) throw new Error("Costo pulizie non valido.");
    rows = buildDailyAdvice({ from, to, now, baseForTwo: base, floor, ceiling, extraGuestFee: extra, guests, maxGuests: property.maxGuests, calendarComplete: text(params.calendarComplete) === "yes", stays: data.stays, blocks: data.blocks, market: data.market });
  } catch (cause) { error = cause instanceof Error ? cause.message : "Parametri non validi."; }
  const fields = [
    { name: "base", label: "Riferimento €/notte per 2 ospiti", value: base, min: "0.01" },
    { name: "extra", label: "Extra €/persona dal 3º, per notte", value: extra, min: "0" },
    { name: "cleaning", label: "Pulizie € una volta per soggiorno", value: cleaning, min: "0" },
    { name: "floor", label: "Minimo €/notte per 2 ospiti", value: floor, min: "0.01" },
    { name: "ceiling", label: "Massimo €/notte per 2 ospiti", value: ceiling, min: "0.01" },
  ];
  return <><Navigation /><AppShell title="Prezzi consigliati giorno per giorno" subtitle="Simulazione interna per il gestore · nessuna modifica alle tariffe salvate o ai portali.">
    <p className="mb-5 rounded-xl border border-amber-300/25 bg-amber-300/5 p-4 text-sm leading-6">Stima interna a bassa affidabilità, non ancora calibrata sui risultati. Parti da un riferimento per 2 persone verificato da te. I valori inseriti valgono solo per questa simulazione. Festività, eventi, recensioni, stagionalità e competitor non verificati non modificano il prezzo.</p>
    <form method="get" className="mb-5 flex flex-wrap items-end gap-3">
      <label className="min-w-0 max-w-full text-sm">Alloggio<select name="propertyId" defaultValue={property.id} className={inputClass}>{data.properties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <button className="rounded-xl border border-white/20 px-4 py-3">Apri alloggio</button>
    </form>
    <form method="get" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <input type="hidden" name="propertyId" value={property.id} />
      <label className="text-sm">Prima notte<input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className={inputClass} required /></label>
      <label className="text-sm">Ultima notte inclusa<input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className={inputClass} required /></label>
      <label className="text-sm">Ospiti<select name="guests" defaultValue={String(guests)} className={inputClass}>{Array.from({ length: property.maxGuests }, (_, i) => <option value={i + 1} key={i}>{i + 1} ospiti</option>)}</select></label>
      {fields.map((field) => <label key={field.name} className="text-sm">{field.label}<input type="number" step="0.01" min={field.min} name={field.name} defaultValue={field.value ?? ""} placeholder={field.value === null ? "Da impostare" : undefined} className={inputClass} /></label>)}
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="calendarComplete" value="yes" defaultChecked={text(params.calendarComplete) === "yes"} />Ho verificato che il calendario sia completo: abilita le riduzioni per date invendute</label>
      <div className="flex items-end gap-3"><button className="min-h-12 rounded-xl bg-[#D8B367] px-5 py-3 font-semibold text-[#07111A]">Calcola</button><Link href={`/revenue-ai/daily?propertyId=${encodeURIComponent(property.id)}`} className="py-3 text-sm">Reimposta</Link></div>
    </form>
    {!rate || rate.occupancyIncluded !== 2 ? <p className="mb-4 text-sm text-amber-200">Non risulta un piano attivo in euro con base verificata per 2 ospiti: inserisci il riferimento prima di ottenere i prezzi.</p> : null}
    {error ? <p role="alert" className="text-red-300">{error}</p> : <DailyAdviceResults rows={rows} extra={extra} cleaning={cleaning} guests={guests} maxGuests={property.maxGuests} minimumStay={rate?.minimumStay ?? 1} maximumStay={rate?.maximumStay ?? null} />}
  </AppShell></>;
}
