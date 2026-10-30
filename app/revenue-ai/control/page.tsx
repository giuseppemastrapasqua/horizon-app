import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Navigation } from '@/components/Navigation';
import { requireRoles, getAccessiblePropertyIds } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
import { analyzeRevenueControl } from '@/lib/revenue/control/analyze';
import { buildRevenueHistory } from '@/lib/revenue/control/history';
export const dynamic = 'force-dynamic';
export default async function RevenueControlPage({ searchParams }: { searchParams: Promise<{propertyId?: string}> }) {
  await requireRoles(['SUPER_ADMIN', 'MANAGER']);
  const ids = await getAccessiblePropertyIds();
  const properties = await prisma.property.findMany({ where: {status:'ACTIVE', ...(ids === null ? {} : {id:{in:ids}})}, select:{id:true,name:true,maxGuests:true,baseGuests:true,extraGuestFee:true,cleaningCost:true,propertyManagementCommissionPercent:true,propertyManagementCommissionVatPercent:true,propertyManagementCommissionVatMode:true,channelCommissions:{select:{channel:true,commissionPercent:true}}}, orderBy:{name:'asc'} });
  const params = await searchParams;
  const property = params.propertyId ? properties.find(p => p.id === params.propertyId) : properties.find(p => p.name === 'Duomo Boutique Apartment') ?? properties[0];
  if (params.propertyId && !property) notFound();
  if (!property) return <><Navigation/><AppShell title="Controllo revenue"><p>Nessun alloggio attivo assegnato.</p></AppShell></>;
  const now = new Date();
  const [stays, blocks, signals, syncs] = await Promise.all([
    prisma.booking.findMany({where:{propertyId:property.id, checkOut:{gte:new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-12,1))}, bookingStatus:{in:['CONFIRMED','CHECKED_IN','CHECKED_OUT']},guestName:{not:'CLOSED'}},select:{id:true,checkIn:true,checkOut:true,bookedAt:true,grossAmount:true,nights:true,bookingStatus:true,currency:true}}),
    prisma.propertyAvailabilityBlock.findMany({where:{propertyId:property.id,endDate:{gte:new Date(now.getTime()-86400000)}},select:{startDate:true,endDate:true}}),
    prisma.revenueDailySignal.findMany({where:{propertyId:property.id,provider:{notIn:['LOCAL','MOCK']},currency:'EUR',capturedAt:{gte:new Date(now.getTime()-72*3600000),lte:now},date:{gte:new Date(now.toISOString().slice(0,10))},marketMedianPrice:{gt:0},confidence:{gte:60}},select:{date:true,capturedAt:true,provider:true},orderBy:{capturedAt:'desc'}}),
    prisma.integrationConnectionProperty.findMany({where:{propertyId:property.id,connection:{enabled:true}},select:{connection:{select:{lastSyncAt:true,lastSyncStatus:true}}}}),
  ]);
  const normalizedStays = stays.map(s=>({...s,guestName:'',grossAmount:s.currency==='EUR'?Number(s.grossAmount):NaN}));
  const r = analyzeRevenueControl(normalizedStays,blocks,now);
  const history = buildRevenueHistory(normalizedStays,r.today);
  const euro = (cents:number)=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(cents/100);
  const marketDays = new Set(signals.filter(s=>s.date.toISOString().slice(0,10)>=r.today && s.date.getTime()<new Date(`${r.today}T00:00:00Z`).getTime()+60*86400000).map(s=>s.date.toISOString().slice(0,10))).size;
  const sync = syncs.map(s=>s.connection).sort((a,b)=>(b.lastSyncAt?.getTime()??0)-(a.lastSyncAt?.getTime()??0))[0];
  const date = (key:string)=>new Date(`${key}T00:00:00Z`).toLocaleDateString('it-IT',{timeZone:'UTC'});
  const panel = 'rounded-2xl border border-white/10 bg-white/[0.035] p-5';
  return <><Navigation/><AppShell title="Controllo revenue giornaliero" subtitle="Dati registrati, problemi da risolvere e date da verificare · nessuna pubblicazione sulle OTA.">
    <form className="mb-5 flex flex-wrap gap-3"><label>Alloggio<select name="propertyId" defaultValue={property.id} className="ml-3 max-w-full rounded-xl bg-[#152330] p-3">{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="rounded-xl border border-white/20 px-5">Aggiorna controllo</button></form>
    <p className="mb-5 text-sm text-white/65">Controllo del {date(r.today)} · aggiornato all’apertura della pagina. Disponibilità da verificare con le OTA: il calendario registrato può essere incompleto. Nessun confronto precedente viene ancora conservato.</p>
    <div className="mb-5 grid gap-4 md:grid-cols-3">{r.windows.map(w=><section key={w.length} className={panel}><h2 className="text-lg text-[#D8B367]">Prossime {w.length} notti</h2><p className="mt-3 text-3xl">{w.occupancy===null?'—':`${w.occupancy}%`}</p><p className="mt-2">{w.booked} prenotate · {w.blocked} bloccate · {w.free.length} apparentemente libere</p><p className="mt-2 text-xs text-white/60">Occupazione sulle notti non bloccate, conteggiate una sola volta.</p></section>)}</div>
    <section className={`${panel} mb-5`}><h2 className="text-xl text-[#D8B367]">Priorità operative</h2><ul className="mt-3 list-disc space-y-3 pl-5">
      {r.overlaps.length>0&&<li>Verificare {r.overlaps.length} sovrapposizioni future prima di modificare disponibilità o prezzi: {r.overlaps.map(o=>`${date(o.from)}–${date(o.to)} (partenza esclusa)`).join('; ')}.</li>}
      {r.unknownAmounts>0&&<li>Completare gli importi di {r.unknownAmounts} soggiorni futuri: non sono trattati come ricavi nulli certi.</li>}
      {r.unknownBookedAt>0?<li>Data di prenotazione assente per {r.unknownBookedAt} soggiorni futuri: nuove prenotazioni negli ultimi 7 giorni non determinabili.</li>:<li>Nuove prenotazioni negli ultimi 7 giorni con soggiorno ancora futuro: {r.pickup}.</li>}
      <li>Dati di mercato recenti con prezzo positivo e affidabilità dichiarata almeno 60/100: {marketDays}/60 date. {marketDays<60?'Confronto incompleto: nessuna variazione automatica.':'Verificare comparabilità, occupazione ospiti e condizioni prima di usare i prezzi.'}</li>
      <li>Verificare le {r.windows[0].free.length} notti apparentemente libere entro 14 giorni. Nessun ribasso suggerito finché prezzi e disponibilità non sono validati.</li>
    </ul></section>
    <section className={`${panel} mb-5`}><h2 className="text-xl text-[#D8B367]">Date da controllare entro 14 giorni</h2><p className="mt-3 leading-7">{r.windows[0].free.length?r.windows[0].free.map(date).join(' · '):'Nessuna notte apparentemente libera.'}</p><p className="mt-3 text-sm text-white/60">Ultima sincronizzazione registrata: {sync?.lastSyncAt?sync.lastSyncAt.toLocaleString('it-IT',{timeZone:'Europe/Rome'}):'non disponibile'} · stato {sync?.lastSyncStatus??'non disponibile'}. Questo stato non certifica la completezza di tutti i canali.</p></section>
    <section className={`${panel} mb-5`}><h2 className="text-xl text-[#D8B367]">Storico per notte effettiva</h2>
      <p className="my-3 text-sm text-white/65">Ultimi 12 mesi, fino a ieri. Importo lordo ripartito sulle notti del soggiorno, inclusi gli eventuali costi presenti nel totale. Non è un prezzo di mercato né il rendiconto per mese di check-out. Mesi vuoti non certificano assenza di attività.</p>
      <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-center text-sm"><thead><tr>{['Mese','Notti registrate','Notti con importo','Notti senza importo','Lordo noto','Lordo / notte con importo'].map(h=><th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{history.map(h=><tr className="border-t border-white/10" key={h.month}><td className="p-3">{h.month}{h.partial?' · parziale':''}{h.overlaps?' · sovrapposizioni':''}{h.invalidNights?' · durata da verificare':''}</td><td>{h.occupied}</td><td>{h.priced}</td><td>{h.missing}</td><td>{h.overlaps?'Da verificare':h.priced?euro(h.grossCents):'Non disponibile'}</td><td>{h.adrCents===null?'Non disponibile':euro(h.adrCents)}</td></tr>)}</tbody></table></div>
      <p className="mt-3 text-xs text-white/60">Quando mancano importi, la media riguarda solo le notti valorizzate. Le sovrapposizioni bloccano la visualizzazione dei valori economici del mese.</p>
    </section>
    <section className={`${panel} mb-5`}><h2 className="text-xl text-[#D8B367]">Parametri economici dell’alloggio</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div><dt>Ospiti base / massimi</dt><dd>{property.baseGuests} / {property.maxGuests}</dd></div><div><dt>Extra persona configurato</dt><dd>{euro(Math.round(Number(property.extraGuestFee)*100))} / notte</dd></div><div><dt>Costo pulizie</dt><dd>{euro(Math.round(Number(property.cleaningCost)*100))} / soggiorno</dd></div><div><dt>Commissione gestione</dt><dd>{Number(property.propertyManagementCommissionPercent)}%</dd></div><div><dt>IVA contrattuale gestione</dt><dd>{Number(property.propertyManagementCommissionVatPercent)}% · {property.propertyManagementCommissionVatMode==='INCLUDED'?'inclusa':property.propertyManagementCommissionVatMode==='EXCLUDED'?'aggiunta':'non applicata'}</dd></div><div><dt>Minimo netto obiettivo</dt><dd>Da definire con il gestore</dd></div></dl>
      <ul className="mt-4 flex flex-wrap gap-4">{property.channelCommissions.map(c=><li key={c.channel}>{c.channel}: {Number(c.commissionPercent)}%</li>)}</ul>
      <p className="mt-3 text-sm text-white/60">Parametri attualmente salvati, da validare prima del pricing. Le commissioni non definiscono da sole il prezzo minimo: mancano obiettivo netto, costi aggiuntivi e promozioni effettive dei portali. Nessun contratto viene modificato da questa pagina.</p>
    </section>
    <p className="text-sm text-white/65">Motore prezzi non ancora attivo: servono dati di mercato verificati, limiti economici e misurazione dei risultati prima di produrre tariffe operative.</p>
  </AppShell></>;
}
