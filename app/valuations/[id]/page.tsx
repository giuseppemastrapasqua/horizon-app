import Link from 'next/link';
import {ActualComparison} from '../ActualComparison';
import {notFound} from 'next/navigation';
import {Navigation} from '@/components/Navigation';
import {AppShell} from '@/components/AppShell';
import {loadValuation} from '@/lib/valuations/store';
import {ValuationEditor,ValuationResults} from '../ValuationEditor';
import {duplicateValuationAction} from '../actions';
export const dynamic='force-dynamic';
export default async function ValuationPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{version?:string;saved?:string}>}){
 const {id}=await params,q=await searchParams;const version=q.version===undefined?undefined:Number(q.version);if(version!==undefined&&(!Number.isInteger(version)||version<1))notFound();
 const {document,snapshot,version:selected}=await loadValuation(id,version);
 const historic=selected!==document.currentVersion;
 return <><Navigation/><AppShell title={snapshot.input.name} subtitle={`Valutazione ${snapshot.input.year} · versione ${selected} · salvata ${new Date(snapshot.savedAt).toLocaleString('it-IT',{timeZone:'Europe/Rome'})}`}>
  <div className="mb-5 flex flex-wrap items-center gap-4 text-sm"><Link className="text-[#E3C57E] underline" href="/valuations">Archivio valutazioni</Link><a className="text-[#E3C57E] underline" href={`/valuations/${id}/pdf?mode=summary&version=${selected}`}>Scarica proposta PDF</a><a className="text-[#E3C57E] underline" href={`/valuations/${id}/pdf?mode=full&version=${selected}`}>PDF completo con prezzi giornalieri</a><form action={duplicateValuationAction}><input type="hidden" name="id" value={id}/><button className="rounded-xl border border-white/15 px-4 py-2">Duplica ultima versione</button></form></div>
  {q.saved==='1'&&!historic&&<p role="status" className="mb-5 text-emerald-300">Valutazione salvata. Il PDF e lo storico fanno riferimento a questa versione.</p>}
  <details className="mb-6 rounded-2xl border border-white/10 p-4"><summary className="cursor-pointer text-[#E3C57E]">Storico delle revisioni ({document.versions.length})</summary><ul className="mt-3 space-y-2 text-sm">{document.versions.map(v=><li key={v.version}><Link className="underline" href={`/valuations/${id}?version=${v.version}`}>Versione {v.version}</Link> · {v.createdAt.toLocaleString('it-IT',{timeZone:'Europe/Rome'})} · {v.note}</li>)}</ul></details>
  {historic?<><p className="mb-5 rounded-xl border border-amber-300/30 p-4">Versione storica in sola lettura. <Link className="underline" href={`/valuations/${id}`}>Torna alla versione corrente</Link>.</p><ValuationResults result={snapshot.result} input={snapshot.input}/></>:<ValuationEditor initial={snapshot.input} id={id} version={document.currentVersion}/>}
  <ActualComparison snapshot={snapshot}/>
 </AppShell></>;
}
