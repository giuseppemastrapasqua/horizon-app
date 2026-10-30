import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { buildAdminMonthlyForecast } from "./admin-monthly-forecast";
export async function loadAdminMonthlyForecast(year:number){
 await requireRoles(["SUPER_ADMIN"]);
 if(!Number.isInteger(year)||year<2020||year>2100)throw new Error("Anno non valido");
 const range={gte:new Date(Date.UTC(year,0,1)),lt:new Date(Date.UTC(year+1,0,1))};
 const [bookings,reports]=await Promise.all([
 prisma.booking.findMany({where:{bookingStatus:{not:"CANCELLED"},guestName:{not:"CLOSED"},property:{status:"ACTIVE"},OR:[{accountingMonth:range},{accountingMonth:null,checkOut:range}]},select:{propertyId:true,currency:true,bookingStatus:true,checkOut:true,accountingMonth:true,grossAmount:true,channel:true,property:{select:{name:true,cleaningCost:true,f24Percent:true,propertyManagementCommissionPercent:true,propertyManagementCommissionVatPercent:true,propertyManagementCommissionVatMode:true,channelCommissions:{select:{channel:true,commissionPercent:true}}}}}}),
 prisma.financeReport.findMany({where:{referenceMonth:range,currency:"EUR",property:{status:"ACTIVE"}},select:{referenceMonth:true,grossRevenue:true,finalAmount:true,formulaSnapshot:true}})]);
 const rows=buildAdminMonthlyForecast(bookings.map(b=>{const p=b.property,c=p.channelCommissions.find(c=>c.channel===b.channel);return {propertyId:b.propertyId,propertyName:p.name,currency:b.currency,bookingStatus:b.bookingStatus,checkOut:b.checkOut,accountingMonth:b.accountingMonth,gross:Number(b.grossAmount),cleaning:Number(p.cleaningCost),pm:Number(p.propertyManagementCommissionPercent),vat:Number(p.propertyManagementCommissionVatPercent),vatMode:p.propertyManagementCommissionVatMode,f24:Number(p.f24Percent),ota:c?Number(c.commissionPercent):["DIRECT","OTHER"].includes(b.channel)?0:null};}),year);
 for(const r of reports){const s=r.formulaSnapshot;if(s&&typeof s==="object"&&!Array.isArray(s)&&s.reportState==="PROVISIONAL")continue;const row=rows[r.referenceMonth.getUTCMonth()];row.reportedGross+=Number(r.grossRevenue);row.reportedOwnerNet+=Number(r.finalAmount);row.reports++;}
 return rows;
}
