import Link from 'next/link';
import {Navigation} from '@/components/Navigation';
import {AppShell} from '@/components/AppShell';
import {requireRoles} from '@/lib/auth/guards';
import {prisma} from '@/lib/prisma';
import {valuationScope,unpackValuation,valuationSearchTokens} from '@/lib/valuations/store';
const labels={DRAFT:'Bozza',REVIEW:'Da verificare',READY:'Pronta',SENT:'Inviata manualmente'};
export const dynamic='force-dynamic';
export default async function ValuationIndex({searchParams}:{searchParams:Promise<{q?:string;page?:string;state?:string}>}){
 const user=await requireRoles(['SUPER_ADMIN','MANAGER']);const params=await searchParams;const page=Math.max(1,Math.min(10000,Math.trunc(Number(params.page)||1)));
 const q=(typeof params.q==='string'?params.q:'').trim().slice(0,160);
 const state=params.state&&Object.hasOwn(labels,params.state)?params.state:'';
 const documents=await prisma.document.findMany({where:{AND:[valuationScope(user),...(q?[{content:{path:['searchTokens'],array_contains:valuationSearchTokens(q)}}]:[]),...(state?[{content:{path:['state'],equals:state}}]:[])]},select:{id:true,title:true,currentVersion:true,updatedAt:true,content:true},orderBy:{updatedAt:'desc'},take:31,skip:(page-1)*30});
 return <><Navigation/><AppShell title="Valutazioni immobili" subtitle="Dalla prima scheda alla proposta al proprietario, con prezzi giornalieri e revisioni conservate.">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><form className="flex flex-wrap gap-3"><label className="text-sm">Cerca immobile, proprietario o zona<input name="q" defaultValue={q} className="ml-3 rounded-xl bg-[#152330] p-3"/></label><label className="text-sm">Stato<select name="state" defaultValue={state} className="ml-3 rounded-xl bg-[#152330] p-3"><option value="">Tutti</option>{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="rounded-xl border border-white/15 px-4">Cerca</button></form><Link className="rounded-xl bg-[#D8B367] px-5 py-3 font-semibold text-[#07111A]" href="/valuations/new">Nuova valutazione</Link></div>
  <div className="grid gap-4 lg:grid-cols-2">{documents.slice(0,30).map(d=>{const s=unpackValuation(d.content);return <Link key={d.id} href={`/valuations/${d.id}`} className="rounded-2xl border border-white/10 bg-[#09131C] p-5 hover:border-[#D8B367]/50"><p className="text-sm text-[#E3C57E]">{labels[s.input.state]} · {s.input.year} · versione {d.currentVersion}</p><h2 className="mt-2 text-xl">{d.title}</h2><p className="mt-2 text-sm text-white/65">{s.input.address||'Indirizzo da inserire'} · {s.input.city}</p><p className="mt-2 text-sm">{s.input.ownerName||'Proprietario non indicato'}</p><p className="mt-3 text-xs text-white/60">Aggiornata {d.updatedAt.toLocaleString('it-IT',{timeZone:'Europe/Rome'})} · {s.result.missing.length?s.result.missing.length+' verifiche aperte':'Riferimenti confermati dal gestore'}</p></Link>;})}</div>
  {!documents.length&&<p className="rounded-2xl border border-white/10 p-6">Nessuna valutazione presente. Puoi iniziare anche per un immobile non ancora in gestione.</p>}
  <div className="mt-5 flex gap-5">{page>1&&<Link href={`/valuations?q=${encodeURIComponent(q)}&state=${state}&page=${page-1}`}>Pagina precedente</Link>}{documents.length>30&&<Link href={`/valuations?q=${encodeURIComponent(q)}&state=${state}&page=${page+1}`}>Pagina successiva</Link>}</div>
 </AppShell></>;
}
