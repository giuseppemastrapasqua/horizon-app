import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Navigation } from '@/components/Navigation';
import { requireRoles } from '@/lib/auth/guards';
import { sectionsForRole } from '@/lib/workspace/sections';
export async function WorkspaceSection({section}:{section:'accounting'|'management'}){
 const user=await requireRoles(['SUPER_ADMIN','MANAGER','FINANCE_ADMIN']);
 const items=sectionsForRole(section,user.role);
 return <><Navigation/><AppShell title={section==='accounting'?'Contabilità':'Gestione'} subtitle={section==='accounting'?'Rendiconti, fatture e costi raccolti in un unico punto.':'Persone, alloggi e configurazione del lavoro.'}>
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map(item=><Link href={item.href} key={item.href} className="rounded-2xl border border-white/10 bg-[#09131C] p-6 transition hover:border-[#D8B367]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B367]"><h2 className="text-lg font-semibold text-[#E3C57E]">{item.title}</h2><p className="mt-3 text-sm leading-6 text-[#A4AFB8]">{item.description}</p></Link>)}</div>
 </AppShell></>;
}
