"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { BarChart3, Coins, ShieldCheck, Target } from "lucide-react";
import { activationSchema, checklist, readiness, type ActivationConfig } from "@/lib/activation/config";
import type { ActivationWorkspaceData } from "@/lib/activation/load-workspace";
import { buildActivationPrices } from "@/lib/activation/pricing";
import { saveActivation } from "../actions";
import { Card, euro, fieldClass, goldButton } from "./controls";
import { DailyPrices } from "./DailyPrices";
import { ListingsPanel, PreparationPanel, ResultsPanel } from "./OperationsPanels";
import { RevenueSettings } from "./RevenueSettings";
import { StaySimulator } from "./StaySimulator";
import { StrategyPanel } from "./StrategyPanel";
import { RevenueOverview } from "./RevenueOverview";

const tabs = ["Preparazione", "Strategia", "Annunci", "Revenue", "Pubblicazione", "Risultati"] as const;
export function ActivationWorkspace({ data, from, to, rangeError }: { data: ActivationWorkspaceData; from: string; to: string; rangeError: boolean }) {
  const [config, setConfig] = useState(data.config), [version, setVersion] = useState(data.version);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Revenue");
  const [guests, setGuests] = useState(Math.min(data.config.baseGuests, data.property.maxGuests));
  const [saved, setSaved] = useState(JSON.stringify(data.config));
  const [message, setMessage] = useState(rangeError ? "Periodo non valido: ripristinati i prossimi due mesi." : "");
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(config) !== saved;
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  const update = (patch: Partial<ActivationConfig>) => setConfig((previous) => {
    const economicsChanged = ["base", "floor", "ceiling", "baseGuests", "extraGuestFee", "cleaning", "otherCosts", "management", "vat", "vatMode", "minimumStay", "launchDiscount"].some((key) => key in patch && patch[key as keyof ActivationConfig] !== previous[key as keyof ActivationConfig]);
    const channels = patch.channels?.map((channel) => {
      const before = previous.channels.find((item) => item.code === channel.code);
      return before && (before.commission !== channel.commission || before.promotion !== channel.promotion) ? { ...channel, promotionsVerified: false } : channel;
    });
    return { ...previous, ...patch, ...(channels ? { channels } : {}), ...(economicsChanged ? { checks: { ...previous.checks, ...patch.checks, economics: false } } : {}) };
  });
  const calculation = useMemo(() => {
    try { return { rows: buildActivationPrices({ config, from, to, guests, maxGuests: data.property.maxGuests,
      stays: data.stays.map((stay) => ({ checkIn: new Date(stay.checkIn), checkOut: new Date(stay.checkOut), bookedAt: stay.bookedAt ? new Date(stay.bookedAt) : null })),
      blocks: data.blocks.map((block) => ({ startDate: new Date(block.startDate), endDate: new Date(block.endDate) })),
      market: data.market.map((day) => ({ ...day, date: new Date(day.date), capturedAt: new Date(day.capturedAt) })) }), error: "" }; }
    catch (cause) { return { rows: [], error: cause instanceof Error ? cause.message : "Verifica i parametri." }; }
  }, [config, from, to, guests, data]);
  const missing = readiness(config);
  if (!data.property.images.length) missing.push("Caricare le fotografie dell’immobile");
  if (calculation.error) missing.push(calculation.error);
  if (calculation.rows.some((row) => row.actionable && row.prices.some((price) => price.net !== null && price.net <= 0))) missing.push("Rivedere tariffe e costi: netto non positivo");
  const completed = Object.values(config.checks).filter(Boolean).length;
  const progress = Math.round(completed / Object.keys(checklist).length * 100);
  const commit = () => {
    const validation = activationSchema.safeParse(config);
    if (!validation.success) { setMessage(validation.error.issues[0]?.message ?? "Verifica i dati."); return; }
    startTransition(async () => {
      try { const result = await saveActivation(data.property.id, version, config); setMessage(result.message); if (result.ok) { setVersion(result.version!); setSaved(JSON.stringify(config)); } }
      catch { setMessage("Salvataggio non riuscito. Verifica accesso e connessione; le modifiche rimangono nella pagina."); }
    });
  };
  return <div className="space-y-5 text-[#FFF8EA]">
    <div className="flex flex-wrap items-center justify-between gap-4"><Link href="/activation" onClick={(event) => { if (dirty && !window.confirm("Uscire senza salvare le modifiche?")) event.preventDefault(); }} className="text-sm text-slate-400">← Attivazione alloggi / {data.property.name}</Link><span className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-400">{version ? `Versione ${version}` : "Bozza da salvare"} · {dirty ? "Modifiche non salvate" : "Configurazione interna"}</span></div>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">{data.property.name}</h1><p className="mt-3 text-sm text-slate-300">Preparazione al lancio · {data.property.city}</p></div><div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg border border-[#D8B367]/50 px-4 py-3 text-sm text-[#D8B367]" onClick={() => { setTab("Pubblicazione"); setMessage(missing.length ? `${missing.length} verifiche ancora da completare.` : "Preparazione completa: verifica sul portale prima di aprire le vendite."); }}>Verifica attivazione →</button><button type="button" className={goldButton} disabled={pending || !dirty} onClick={commit}>{pending ? "Salvataggio…" : "Salva configurazione"}</button></div></header>
    <nav aria-label="Schede attivazione" className="flex overflow-x-auto border-b border-white/20">{tabs.map((item) => <button type="button" key={item} aria-current={tab === item ? "page" : undefined} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-4 py-4 text-sm ${tab === item ? "border-[#D8B367] text-[#D8B367]" : "border-transparent text-slate-300"}`}>{item}</button>)}</nav>
    {message && <p role="status" className="rounded-lg border border-[#D8B367]/30 bg-[#D8B367]/5 p-4 text-sm">{message}</p>}
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/15 bg-white/[0.025] p-4"><span className="text-sm">Checklist verificata al <strong className="text-[#D8B367]">{progress}%</strong></span><progress aria-label="Avanzamento checklist" className="h-2 min-w-32 flex-1 accent-[#D8B367]" max={100} value={progress} /><span className="text-xs text-slate-400">{missing.length} verifiche da completare</span></div>
    {tab === "Revenue" && <>
      <div className="grid gap-4 md:grid-cols-3">{[{ label: `Prezzo base · ${config.baseGuests} ospiti`, value: euro(config.base), Icon: Coins }, { label: "Soglia minima / notte", value: euro(config.floor), Icon: BarChart3 }, { label: "Obiettivo netto mensile", value: euro(config.targetMonthly), Icon: Target }].map(({ label, value, Icon }) => <Card key={label}><div className="flex items-center gap-4"><Icon className="size-9 shrink-0 text-[#D8B367]" strokeWidth={1.3} /><div><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-serif text-2xl">{value}</p></div></div></Card>)}</div>
      <RevenueSettings config={config} update={update} maxGuests={data.property.maxGuests} />
      <label className="block max-w-56 text-sm">Simula numero ospiti<select className={fieldClass} value={guests} onChange={(event) => setGuests(Number(event.target.value))}>{Array.from({ length: data.property.maxGuests }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} ospiti</option>)}</select></label>
      {calculation.error ? <p role="alert" className="text-amber-200">{calculation.error}</p> : <>
        <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]"><StaySimulator key={`${from}-${to}`} config={config} rows={calculation.rows} /><Card title="Controlli Revenue"><ShieldCheck className="mb-4 text-[#D8B367]" /><div className="space-y-3 text-sm">{[{ ok: config.checks.economics, label: "Costi e basi di calcolo confermati" }, { ok: config.channels.filter((item) => item.enabled).every((item) => item.commission !== null && item.promotionsVerified), label: "Commissioni e cumulabilità promozioni" }, { ok: config.floor !== null, label: "Soglia minima configurata" }, { ok: Boolean(config.launchStart && config.exitCriteria.trim()), label: "Periodo e criteri di lancio definiti" }].map((item) => <p key={item.label} className={item.ok ? "text-emerald-300" : "text-amber-200"}>{item.ok ? "✓" : "!"} {item.label}</p>)}<p className="border-t border-white/10 pt-4 text-xs leading-6 text-slate-400">Stima interna a bassa affidabilità. Eventi, recensioni e competitor non verificati non modificano automaticamente il prezzo. I parametri richiedono approvazione del gestore.</p></div></Card></div>
        <RevenueOverview config={config} rows={calculation.rows} update={update} />
        <DailyPrices key={`${from}-${to}`} rows={calculation.rows} config={config} from={from} to={to} propertyId={data.property.id} dirty={dirty} />
      </>}
    </>}
    {tab === "Preparazione" && <PreparationPanel config={config} update={update} data={data} />}
    {tab === "Strategia" && <StrategyPanel config={config} update={update} />}
    {tab === "Annunci" && <ListingsPanel config={config} update={update} data={data} />}
    {tab === "Risultati" && <ResultsPanel config={config} update={update} data={data} />}
    {tab === "Pubblicazione" && <Card title="Verifica prima dell’apertura vendite"><p className="mb-5 text-sm leading-6 text-slate-400">Questa verifica prepara il lavoro. La pubblicazione e l’invio prezzi sui portali richiedono un’integrazione verificata e non avvengono da questa pagina.</p><ul className="space-y-3 text-sm">{missing.map((item) => <li className="text-amber-200" key={item}>! {item}</li>)}{!missing.length && <li className="text-emerald-300">✓ Preparazione completa. Verifica tariffe, disponibilità e annunci sui portali.</li>}</ul><div className="mt-6 space-y-3">{config.channels.filter((item) => item.enabled).map((channel) => <p key={channel.code} className="text-sm text-slate-300">{channel.code} · {channel.published && channel.url ? <a className="text-[#D8B367] underline" href={channel.url} target="_blank" rel="noopener noreferrer">Pubblicazione confermata manualmente ↗</a> : "Pubblicazione da verificare"}</p>)}</div></Card>}
  </div>;
}
