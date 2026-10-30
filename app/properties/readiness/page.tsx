import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Navigation } from '@/components/Navigation';
import { loadPropertyReadiness } from '@/lib/properties/load-readiness';
export const dynamic='force-dynamic';
export default async function PropertyReadinessPage(){
 const properties=await loadPropertyReadiness();
 return <><Navigation/><AppShell title="Controllo alloggi" subtitle="Dati, collegamenti e parametri da completare, raccolti per alloggio.">
  <Link className="mb-5 inline-block text-[#D8B367] underline" href="/properties">Torna agli alloggi</Link>
  <div className="grid gap-4 lg:grid-cols-2">{properties.map(p=>{
   const issues:string[]=[];
   if(!p.address.trim()||p.maxGuests<1||p.bedrooms===null||!p.bathrooms)issues.push('Verificare indirizzo, camere, bagni e capienza.');
   if(!p.channelCommissions.length)issues.push('Commissioni OTA non configurate.');
   if(!p._count.images)issues.push('Foto non caricate.');
   if(!p.integrationConnections.length)issues.push('Nessun collegamento attivo registrato.');
   if(p.integrationConnections.some(i=>i.connection.lastSyncStatus!=='SUCCESS'||!i.connection.lastSyncAt||Date.now()-i.connection.lastSyncAt.getTime()>48*3600000))issues.push('Almeno un collegamento non ha una sincronizzazione riuscita nelle ultime 48 ore.');
   if(!p.ratePlans.some(r=>Number(r.basePrice)>0))issues.push('Tariffa base positiva non configurata.');
   if(Number(p.propertyManagementCommissionPercent)<=0)issues.push('Commissione gestione a zero: da confermare prima dei conteggi.');
   if(Number(p.cleaningCost)<=0)issues.push('Costo pulizie a zero: da confermare.');
   if(p._count.bookings)issues.push(`${p._count.bookings} soggiorni futuri hanno importo zero o negativo: verificare i dati.`);
   return <section className="rounded-2xl border border-white/10 bg-[#09131C] p-5" key={p.id}><h2 className="text-lg font-semibold text-[#E3C57E]">{p.name}</h2><p className="mt-2 text-sm text-white/60">{p._count.images} foto · {p.integrationConnections.length} collegamenti attivi · {p.maxGuests} ospiti</p>
    <ul className="my-4 list-disc space-y-2 pl-5 text-sm">{issues.length?issues.map(issue=><li key={issue}>{issue}</li>):<li>Nessuna anomalia rilevata da questi controlli.</li>}</ul>
    <p className="mb-4 text-xs text-white/60">Commissioni salvate: {p.channelCommissions.map(c=>`${c.channel} ${Number(c.commissionPercent)}%`).join(' · ')||'non disponibili'}. La presenza del collegamento non certifica la completezza del calendario né la pubblicazione dei prezzi.</p>
    <div className="flex flex-wrap gap-3 text-sm"><Link className="text-[#D8B367] underline" href={`/properties/${p.id}/edit`}>Apri configurazione</Link><Link className="text-[#D8B367] underline" href={`/bookings?propertyId=${encodeURIComponent(p.id)}`}>Prenotazioni</Link></div>
   </section>;
  })}</div>{!properties.length?<p>Nessun alloggio assegnato da verificare.</p>:null}
 </AppShell></>;
}
