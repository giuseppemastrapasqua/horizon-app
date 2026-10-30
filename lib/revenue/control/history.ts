import type { ControlStay } from './analyze';
const day = 86400000;
const utc = (d:Date) => new Date(`${d.toISOString().slice(0,10)}T00:00:00Z`).getTime();
/** Revenue analysis uses physical nights, independently of accounting-month overrides. */
export function buildRevenueHistory(stays:ControlStay[],today:string) {
  const stop = new Date(`${today}T00:00:00Z`);
  const start = Date.UTC(stop.getUTCFullYear(),stop.getUTCMonth()-11,1);
  const rows = Array.from({length:12},(_,i)=>{
    const from = new Date(start);from.setUTCMonth(from.getUTCMonth()+i);
    return {month:from.toISOString().slice(0,7),occupied:new Set<string>(),priced:new Set<string>(),missing:new Set<string>(),overlaps:new Set<string>(),seen:new Set<string>(),grossCents:0,invalidStays:0};
  });
  for (const stay of stays) {
    if (!['CONFIRMED','CHECKED_IN','CHECKED_OUT'].includes(stay.bookingStatus)||stay.guestName==='CLOSED') continue;
    const from = utc(stay.checkIn),to = utc(stay.checkOut),length = (to-from)/day;
    if(!Number.isInteger(length)||length<1||!Number.isFinite(length)) continue;
    // The physical interval is authoritative. Imported night counts may be inconsistent.
    const gross = Number.isFinite(stay.grossAmount)&&stay.grossAmount>0?Math.round(stay.grossAmount*100):null;
    for(let time=Math.max(from,start);time<Math.min(to,stop.getTime());time+=day){
      const date = new Date(time).toISOString().slice(0,10);
      const row = rows.find(r=>r.month===date.slice(0,7));if(!row)continue;
      if(row.seen.has(date)) row.overlaps.add(date);
      row.seen.add(date);row.occupied.add(date);
      if(stay.nights!==length)row.invalidStays++;
      if(gross===null){row.missing.add(date);continue;}
      row.priced.add(date);
      const index=(time-from)/day;
      row.grossCents+=Math.floor(gross/length)+(index<gross%length?1:0);
    }
  }
  return rows.map(r=>({month:r.month,occupied:r.occupied.size,priced:r.priced.size,missing:r.missing.size,overlaps:r.overlaps.size,grossCents:r.grossCents,adrCents:r.overlaps.size||!r.priced.size?null:Math.round(r.grossCents/r.priced.size),partial:r.month===today.slice(0,7),invalidNights:r.invalidStays}));
}
