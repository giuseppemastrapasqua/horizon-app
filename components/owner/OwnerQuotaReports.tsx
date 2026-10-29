import Link from "next/link";
import { ownerQuotaReports, ownerShareKey } from "@/lib/owners/revenue-share-access";
import { readRevenueSplit, splitCents } from "@/lib/finance/report-revenue-split";

export async function OwnerQuotaReports({ userId, reportId }: { userId:string; reportId?:string }) {
  const all = await ownerQuotaReports(userId);
  const reports = reportId ? all.filter(r=>r.id===reportId) : all;
  if (!reports.length) return null;
  const money=(v:number,c:string)=>new Intl.NumberFormat("it-IT",{style:"currency",currency:c}).format(v/100);
  return <section className="space-y-4"><h2 className="text-xl text-[#D8B367]">I tuoi rendiconti</h2>{reports.map(r=>{
    const split=readRevenueSplit(r.formulaSnapshot,r.referenceMonth),key=ownerShareKey(r.formulaSnapshot,r.referenceMonth,userId);
    const index=split?.recipients.findIndex(s=>s.key===key)??-1;
    const amount=(v:unknown)=>split && index>=0?splitCents(Math.round(Number(v)*100),split,index):Math.round(Number(v)*100);
    return <article key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3>{r.property.name} · {r.referenceMonth.toLocaleDateString("it-IT",{month:"long",year:"numeric",timeZone:"UTC"})}</h3>
      <p className="mt-2">{split && index>=0?`${split.recipients[index].name} · Quota ${split.recipients[index].basisPoints/100}%`:"Rendiconto precedente alla ripartizione"}</p>
      <p className="mt-3">Lordo di tua competenza: {money(amount(r.grossRevenue),r.currency)}</p>
      <p>Netto salvato di tua competenza: {money(amount(r.finalAmount),r.currency)}</p>
      <div className="mt-4 flex gap-5 text-[#D8B367]"><Link href={`/reports/monthly/${r.id}/pdf`}>Rendiconto PDF</Link><Link href={`/reports/monthly/${r.id}/property-statement/pdf`}>Documento commercialista</Link></div>
    </article>;
  })}</section>;
}
