"use client";

import { useState } from "react";
import { channelLabels, type ActivationConfig } from "@/lib/activation/config";
import { addDays, dayRange } from "@/lib/activation/dates";
import { projectStay } from "@/lib/activation/finance";
import type { ActivationPrice } from "@/lib/activation/pricing";
import { Card, euro, fieldClass } from "./controls";

export function StaySimulator({ config, rows }: { config: ActivationConfig; rows: ActivationPrice[] }) {
  const [arrival, setArrival] = useState(rows[0]?.date ?? "");
  const [departure, setDeparture] = useState(rows[0] ? addDays(rows[0].date, config.minimumStay) : "");
  const [code, setCode] = useState(config.channels.find((item) => item.enabled)?.code ?? "BOOKING");
  const channel = config.channels.find((item) => item.code === code);
  let error = "", gross = 0;
  let projection: ReturnType<typeof projectStay> | null = null;
  try {
    const nights = dayRange(arrival, addDays(departure, -1));
    if (nights.length < config.minimumStay) throw new Error(`Soggiorno minimo: ${config.minimumStay} notti.`);
    for (const date of nights) {
      const row = rows.find((item) => item.date === date);
      const price = row?.prices.find((item) => item.code === code);
      if (!row || price?.final === null || !price) throw new Error("Completa i prezzi o seleziona date comprese nel periodo.");
      if (!row.actionable) throw new Error("Il soggiorno contiene date prenotate, bloccate o passate.");
      gross += price.final;
    }
    if (channel?.commission === null || !channel || !channel.enabled) throw new Error("Seleziona un canale attivo e configurato.");
    projection = projectStay(config, gross, channel.commission);
  } catch (cause) { error = cause instanceof Error ? cause.message : "Verifica i parametri."; }
  return <Card title="Simulatore di soggiorno"><p className="mb-5 text-sm text-slate-400">Calcola il netto sulle singole tariffe giornaliere e sul numero ospiti selezionato.</p>
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><label className="text-sm">Arrivo<input type="date" className={fieldClass} value={arrival} onChange={(event) => setArrival(event.target.value)} /></label><label className="text-sm">Partenza<input type="date" className={fieldClass} value={departure} onChange={(event) => setDeparture(event.target.value)} /></label><label className="text-sm">Portale<select className={fieldClass} value={code} onChange={(event) => setCode(event.target.value as typeof code)}>{config.channels.filter((item) => item.enabled).map((item) => <option key={item.code} value={item.code}>{channelLabels[item.code]}</option>)}</select></label></div>
    {error ? <p role="status" className="text-sm text-amber-200">{error}</p> : projection && <div className="space-y-3 text-sm"><div className="flex justify-between gap-4"><span>Totale soggiorno · pulizie incluse</span><span>{euro(gross)}</span></div>{projection.rows.map((row) => <div className="flex justify-between gap-4 text-slate-300" key={row.label}><span>{row.label}</span><span>− {euro(row.amount)}</span></div>)}<div className="flex justify-between gap-4 border-t border-[#D8B367]/50 pt-4 font-serif text-xl text-[#D8B367]"><span>Netto prima delle imposte personali</span><span>{euro(projection.net)}</span></div></div>}
    <p className="mt-4 text-xs leading-5 text-slate-400">Proiezione con i parametri di questa scheda, calcolata dal motore formule condiviso. L’obiettivo mensile non è una previsione di ricavo.</p>
  </Card>;
}
