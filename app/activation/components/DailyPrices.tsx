"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { channelLabels, type ActivationConfig } from "@/lib/activation/config";
import { addDays, addMonths } from "@/lib/activation/dates";
import type { ActivationPrice } from "@/lib/activation/pricing";
import { Card, euro, fieldClass, goldButton } from "./controls";

export function DailyPrices({ rows, config, from, to, propertyId, dirty }: { rows: ActivationPrice[]; config: ActivationConfig; from: string; to: string; propertyId: string; dirty: boolean }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [start, setStart] = useState(from), [end, setEnd] = useState(to);
  const active = config.channels.filter((channel) => channel.enabled);
  const size = 14, pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages - 1);
  const download = () => {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [["Data", "Stato", "Lancio", "Base", ...active.flatMap((channel) => [`${channelLabels[channel.code]} listino`, `${channelLabels[channel.code]} finale`]), "Minimo notti"],
      ...rows.map((row) => [row.date, row.status, row.launch ? "Si" : "No", row.base ?? "", ...active.flatMap((channel) => { const price = row.prices.find((item) => item.code === channel.code); return [price?.list ?? "", price?.final ?? ""]; }), config.minimumStay])].map((line) => line.map(escape).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `prezzi-${from}-${to}.csv`; link.click(); URL.revokeObjectURL(url);
  };
  return <Card title="Prezzi giornalieri">
    <p className="mb-4 text-sm text-slate-400">Dal {from.split("-").reverse().join("/")} al {to.split("-").reverse().join("/")} · {rows.length} date · ultima notte inclusa</p>
    <form className="mb-5 flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); if (dirty && !window.confirm("Hai modifiche non salvate. Cambiare periodo le scarterà. Continuare?")) return; router.push(`/activation/${propertyId}?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`); }}>
      <label className="text-sm">Dal<input type="date" required className={fieldClass} value={start} onChange={(event) => setStart(event.target.value)} /></label>
      <label className="text-sm">Al<input type="date" required className={fieldClass} value={end} onChange={(event) => setEnd(event.target.value)} /></label>
      <button type="button" className="rounded-lg border border-white/20 px-3 py-3 text-sm" onClick={() => { if (start) setEnd(addDays(start, 59)); }}>60 giorni</button>
      <button type="button" className="rounded-lg border border-[#D8B367]/50 px-3 py-3 text-sm text-[#D8B367]" onClick={() => { if (start) setEnd(addMonths(start, 2)); }}>2 mesi</button>
      <button className={goldButton}>Apri periodo</button><button type="button" className="px-3 py-3 text-sm text-[#D8B367] underline" onClick={download}>Esporta CSV</button>
    </form>
    <p className="mb-4 text-xs leading-5 text-slate-400">Importi pulizie incluse. Ogni canale mostra listino e finale dopo la promozione configurata. I prezzi sono proposte interne: le date prenotate o bloccate non sono modificabili e nessun dato viene inviato ai portali.</p>
    <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><caption className="sr-only">Proposte giornaliere per portale</caption><thead className="border-b border-white/15 text-xs text-slate-400"><tr>{["Data", "Stato", "Base", ...active.map((channel) => channelLabels[channel.code]), "Min. notti", "Controllo"].map((label) => <th scope="col" key={label} className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody>
      {rows.slice(current * size, (current + 1) * size).map((row) => <tr key={row.date} className="border-b border-white/10 align-top">
        <th scope="row" className="px-3 py-3 font-normal"><span>{new Date(`${row.date}T12:00:00Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "short", weekday: "short", timeZone: "Europe/Rome" })}</span>{row.launch && <span className="mt-1 block text-xs text-[#D8B367]">Lancio −{row.launchDiscount}%</span>}</th>
        <td className={`px-3 py-3 ${row.actionable ? "text-emerald-300" : "text-[#D8B367]"}`}>{row.status}</td><td className="px-3 py-3">{euro(row.base)}</td>
        {active.map((channel) => { const price = row.prices.find((item) => item.code === channel.code); return <td className="px-3 py-3" key={channel.code}><span>{price?.final === null || !price ? "Da configurare" : euro(price.final)}</span>{price?.list !== null && price && price.promotion > 0 && <span className="mt-1 block text-xs text-slate-400">Listino {euro(price.list)} · −{price.promotion}%</span>}</td>; })}
        <td className="px-3 py-3">{config.minimumStay}</td><td className="max-w-64 px-3 py-3"><span className="text-xs text-amber-200">{!row.actionable ? "Solo consultazione" : row.prices.some((price) => price.net !== null && price.net <= 0) ? "Netto non positivo" : row.floorProtected ? "Soglia protetta" : "Da approvare"}</span><details className="mt-2 text-xs text-slate-400"><summary className="cursor-pointer">Motivazione</summary><ul className="mt-2 space-y-1">{row.rationale.map((reason) => <li key={reason}>{reason}</li>)}</ul></details></td>
      </tr>)}
    </tbody></table></div>
    <div className="mt-5 flex items-center justify-between gap-4 text-sm"><p className="text-slate-400">{current * size + 1}–{Math.min((current + 1) * size, rows.length)} di {rows.length} date · Affidabilità bassa, stima interna</p><div className="flex items-center gap-3"><button type="button" aria-label="Pagina precedente" disabled={current === 0} className="rounded border border-white/20 px-3 py-2 disabled:opacity-30" onClick={() => setPage(current - 1)}>←</button><span>{current + 1}/{pages}</span><button type="button" aria-label="Pagina successiva" disabled={current + 1 >= pages} className="rounded border border-white/20 px-3 py-2 disabled:opacity-30" onClick={() => setPage(current + 1)}>→</button></div></div>
  </Card>;
}
