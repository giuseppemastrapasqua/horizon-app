import type { buildDailyAdvice } from "@/lib/revenue/daily/build-daily-advice";
const euro = (value: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(value);
export function DailyAdviceResults({ rows, extra, cleaning, guests, maxGuests, minimumStay, maximumStay }: {
  rows: ReturnType<typeof buildDailyAdvice>; extra: number; cleaning: number; guests: number; maxGuests: number; minimumStay: number; maximumStay: number | null;
}) {
  const quotable = rows.length >= minimumStay && (maximumStay === null || rows.length <= maximumStay) && rows.every((row) => row.status === "Libera" && row.selectedPrice !== null);
  const nightsTotal = rows.reduce((sum, row) => sum + Math.round((row.selectedPrice ?? 0) * 100), 0) / 100;
  return <div className="space-y-5">
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <h2 className="text-lg font-semibold">Simulazione soggiorno · {guests} ospiti · {rows.length} notti</h2>
      {quotable ? <><p className="mt-3 text-2xl text-[#D8B367]">{euro(nightsTotal + cleaning)}</p><p className="mt-2 text-sm text-white/65">Somma notti {euro(nightsTotal)} + pulizie {euro(cleaning)}, aggiunte una sola volta. Per un ospite si usa la stessa base di due persone.</p></> : <p className="mt-3 text-sm text-white/65">Totale soggiorno non disponibile: manca il riferimento oppure il periodo comprende notti prenotate, bloccate o passate, oppure non rispetta i limiti di durata.</p>}
      <p className="mt-3 text-xs text-white/60">Importi prima delle commissioni OTA, gestione e imposte. Il minimo inserito è un limite tariffario, non una verifica del margine netto. Durata configurata: minimo {minimumStay} notti{maximumStay ? `, massimo ${maximumStay}` : ""}. Eventuali regole speciali di calendario vanno verificate prima di vendere.</p>
    </section>
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => <article key={row.date} className="min-w-0 rounded-2xl border border-white/10 bg-[#0F172A] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">{new Date(`${row.date}T00:00:00Z`).toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}</h2><span className={row.status === "Libera" ? "text-emerald-300" : "text-amber-200"}>{row.status}</span></div>
        <p className="mt-3 text-sm text-white/60">Base per 2 ospiti / notte</p><p className="text-2xl text-[#D8B367]">{row.base === null ? "Da configurare" : euro(row.base)}</p>
        <p className="mt-2 text-sm">{guests} ospiti: {row.selectedPrice === null ? "—" : euro(row.selectedPrice)} / notte</p>
        <p className="mt-2 text-xs text-white/60">{row.confidence} · {row.adjustment > 0 ? "+" : ""}{row.adjustment}% sul riferimento{row.limited ? " · limite applicato" : ""}</p>
        <details className="mt-4 text-sm"><summary className="cursor-pointer text-[#D8B367]">Fattori e prezzi per ospiti</summary>
          <p className="mt-3 text-white/65">Occupazione nota da prenotazioni nei 30 giorni: {row.occupancy}%. Altre notti bloccate: {row.blockedNights}. Anticipo: {Math.max(0, row.lead)} giorni.</p>
          <ul className="my-3 space-y-1">{row.factors.map((factor) => <li key={factor.label}>{factor.label}: {factor.percent > 0 ? "+" : ""}{factor.percent}%</li>)}</ul>
          <p className="text-xs text-white/60">Correzioni iniziali convenzionali, con variazione complessiva limitata a ±20%. I blocchi non sono conteggiati come vendite; le riduzioni per bassa occupazione richiedono un calendario confermato completo e senza blocchi nella finestra.</p>
          {row.marketProvider ? <p className="mt-2 text-xs text-white/60">Dato mercato {row.marketProvider}, acquisito {row.marketCapturedAt?.slice(0, 10)}: escluso dal prezzo finché non è verificata la comparabilità con 2 ospiti.</p> : <p className="mt-2 text-xs text-white/60">Mercato aggiornato verificabile: assente. Dati LOCAL e MOCK esclusi.</p>}
          {row.base !== null ? <dl className="mt-3 space-y-1">{Array.from({ length: maxGuests }, (_, index) => index + 1).map((count) => <div className="flex justify-between gap-2" key={count}><dt>{count} ospiti</dt><dd>{euro(row.base! + Math.max(0, count - 2) * extra)}</dd></div>)}</dl> : null}
        </details>
      </article>)}
    </section>
  </div>;
}
