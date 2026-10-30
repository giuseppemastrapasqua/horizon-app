export type ForecastBooking = { propertyId:string; propertyName:string; currency:string; bookingStatus:string; checkOut:Date; accountingMonth:Date|null; gross:number; cleaning:number; pm:number; vat:number; vatMode:string; f24:number; ota:number|null };
export type ForecastMonth = { month:string; count:number; gross:number; ota:number; cleaning:number; management:number; managementVat:number; ownerNet:number; companyMargin:number; missing:string[]; reportedGross:number; reportedOwnerNet:number; reports:number };
export function buildAdminMonthlyForecast(bookings:ForecastBooking[],year:number):ForecastMonth[]{
 const rows=Array.from({length:12},(_,i)=>({month:`${year}-${String(i+1).padStart(2,"0")}`,count:0,gross:0,ota:0,cleaning:0,management:0,managementVat:0,ownerNet:0,companyMargin:0,missing:[] as string[],reportedGross:0,reportedOwnerNet:0,reports:0}));
 for(const b of bookings){
  const date=b.accountingMonth??b.checkOut;
  if(b.bookingStatus==="CANCELLED" || date.getUTCFullYear()!==year) continue;
  const row=rows[date.getUTCMonth()];
  if(b.currency!=="EUR"){if(!row.missing.includes(b.propertyName))row.missing.push(b.propertyName);continue;}
  row.count++;row.gross+=b.gross;row.cleaning+=b.cleaning;
  if(b.ota!==null) row.ota+=b.gross*b.ota/100;
  if(b.ota===null || b.pm<=0){if(!row.missing.includes(b.propertyName))row.missing.push(b.propertyName);continue;}
  const base=Math.max(0,b.gross-b.gross*b.ota/100-b.cleaning),nominal=base*b.pm/100;
  const taxable=b.vatMode==="INCLUDED"?nominal/(1+b.vat/100):nominal;
  const total=b.vatMode==="EXCLUDED"?nominal*(1+b.vat/100):nominal;
  row.management+=taxable;row.managementVat+=total-taxable;
  row.ownerNet+=Math.max(0,base-total)*(1-b.f24/100);
 }
 for(const r of rows){r.companyMargin=r.management-r.cleaning;for(const k of ["gross","ota","cleaning","management","managementVat","ownerNet","companyMargin"] as const)r[k]=Math.round(r[k]*100)/100;}
 return rows;
}
