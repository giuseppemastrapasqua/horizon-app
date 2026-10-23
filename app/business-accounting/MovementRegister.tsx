"use client";

import { useState } from "react";
import { euro, movementKinds, type Movement } from "@/lib/business-accounting/config";
import { buttonClass, inputClass, panelClass } from "./AccountingSettings";

function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function MovementRegister({ movements, edit, update }: { movements: Movement[]; edit: (m: Movement) => void; update: (m: Movement) => void }) {
  const [month, setMonth] = useState("");
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(0);
  const rows = movements.filter((m) => (archived || !m.archived) && (!month || m.date.slice(5, 7) === month) && (!kind || m.kind === kind) && `${m.description} ${m.category} ${m.reference}`.toLocaleLowerCase("it").includes(query.toLocaleLowerCase("it"))).sort((a, b) => b.date.localeCompare(a.date));
  const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / 20) - 1));
  return <section className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-xl">Registro movimenti</h2><button type="button" className={buttonClass} onClick={() => {
    const headers = ["Data", "Tipo", "Descrizione", "Categoria", "Riferimento", "Importo EUR", "Pagato", "Anno fiscale", "Contributo deducibile", "Archiviato"];
    const body = rows.map((m) => [m.date, movementKinds[m.kind], m.description, m.category, m.reference, (m.amount / 100).toFixed(2).replace(".", ","), m.paid ? "Sì" : "No", String(m.taxYear), m.deductible ? "Sì" : "No", m.archived ? "Sì" : "No"]);
    const url = URL.createObjectURL(new Blob(["\ufeff", [headers, ...body].map((row) => row.map(csvCell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "contabilita-movimenti.csv"; link.click(); URL.revokeObjectURL(url);
  }}>Esporta CSV filtrato</button></div>
    <div className="mt-4 grid gap-3 md:grid-cols-3"><label className="text-xs">Mese<select className={inputClass} value={month} onChange={(e) => { setMonth(e.target.value); setPage(0); }}><option value="">Tutti i mesi</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{i + 1}</option>)}</select></label><label className="text-xs">Tipo<select className={inputClass} value={kind} onChange={(e) => { setKind(e.target.value); setPage(0); }}><option value="">Tutti i tipi</option>{Object.entries(movementKinds).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label><label className="text-xs">Cerca<input className={inputClass} value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Descrizione, categoria, riferimento" /></label></div>
    <label className="mt-4 block text-sm"><input type="checkbox" checked={archived} onChange={(e) => { setArchived(e.target.checked); setPage(0); }} /> Mostra anche archiviati</label>
    <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-400"><tr>{["Data", "Voce", "Categoria / riferimento", "Importo", "Stato", "Azioni"].map((s) => <th className="p-2 font-normal" key={s}>{s}</th>)}</tr></thead><tbody>{rows.slice(currentPage * 20, (currentPage + 1) * 20).map((m) => <tr key={m.id} className={`border-t border-white/10 ${m.archived ? "opacity-50" : ""}`}><td className="whitespace-nowrap p-2">{m.date.split("-").reverse().join("/")}</td><td className="p-2"><span className="block text-xs text-[#D8B367]">{movementKinds[m.kind]}</span>{m.description}</td><td className="p-2">{m.category}<span className="block text-xs text-slate-400">{m.reference}</span></td><td className="p-2 tabular-nums">{euro(m.amount)}</td><td className="p-2">{m.archived ? "Archiviato" : m.paid ? "Regolato" : "Da regolare"}{["TAX", "CONTRIBUTION"].includes(m.kind) && <span className="block text-xs text-slate-400">Anno fiscale {m.taxYear}</span>}</td><td className="p-2"><div className="flex gap-3"><button type="button" className="text-[#D8B367]" onClick={() => edit(m)}>Modifica</button><button type="button" className="text-slate-300" onClick={() => update({ ...m, archived: !m.archived })}>{m.archived ? "Ripristina" : "Archivia"}</button></div></td></tr>)}</tbody></table></div>
    {!rows.length && <p className="py-6 text-sm text-slate-400">Nessun movimento. Registra gli incassi e i costi per costruire la tua contabilità.</p>}
    <div className="mt-4 flex items-center gap-4 text-sm"><button type="button" disabled={!currentPage} className={buttonClass} onClick={() => setPage(currentPage - 1)}>Precedenti</button><span>{rows.length} movimenti · pagina {currentPage + 1}</span><button type="button" className={buttonClass} disabled={(currentPage + 1) * 20 >= rows.length} onClick={() => setPage(currentPage + 1)}>Successivi</button></div>
  </section>;
}
