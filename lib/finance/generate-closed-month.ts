import { prisma } from "@/lib/prisma";
import { createFinanceReport } from "./create-finance-report";
export function previousRomeMonth(now = new Date()) {
 const parts = new Intl.DateTimeFormat("en", { timeZone: "Europe/Rome", year: "numeric", month: "numeric" }).formatToParts(now);
 const year=Number(parts.find(p=>p.type==="year")!.value), month=Number(parts.find(p=>p.type==="month")!.value);
 return new Date(Date.UTC(year,month-2,1));
}
export async function generateClosedMonth(now = new Date()) {
 const month=previousRomeMonth(now), end=new Date(Date.UTC(month.getUTCFullYear(),month.getUTCMonth()+1,1));
 const properties=await prisma.property.findMany({where:{status:"ACTIVE"},select:{id:true,propertyManagementCommissionPercent:true}});
 const result={month:month.toISOString().slice(0,7),created:0,skipped:0,failed:[] as string[]};
 for(const property of properties){
  try {
   if(Number(property.propertyManagementCommissionPercent)<=0) throw new Error("Configurazione commissione mancante");
   const existing=await prisma.financeReport.findUnique({where:{propertyId_referenceMonth:{propertyId:property.id,referenceMonth:month}},select:{id:true,createdAt:true,updatedAt:true}});
   // Closed reports remain stable. Provisional reports made before month end are regenerated on closing.
   if(existing && existing.updatedAt>=end){result.skipped++;continue;}
   await createFinanceReport({propertyId:property.id,referenceMonth:month,existingReportId:existing?.id});result.created++;
  }catch{result.failed.push(property.id);}
 }
 return result;
}
