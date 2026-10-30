import {describe,it,expect} from 'vitest';
import {buildRevenueHistory} from './history';
import type {ControlStay} from './analyze';
const stay=(id:string,from:string,to:string,grossAmount:number,extra={}):ControlStay=>({id,checkIn:new Date(from),checkOut:new Date(to),grossAmount,nights:(new Date(to).getTime()-new Date(from).getTime())/86400000,bookedAt:null,guestName:'',bookingStatus:'CONFIRMED',...extra});
describe('physical-night revenue history',()=>{
 it('allocates cross-month income to physical nights and conserves every cent',()=>{const r=buildRevenueHistory([stay('a','2026-09-30','2026-10-03',100)],'2026-10-30');expect(r.find(x=>x.month==='2026-09')?.grossCents).toBe(3334);expect(r.find(x=>x.month==='2026-10')?.grossCents).toBe(6666);});
 it('excludes cancellations, calendar placeholders, today and future nights',()=>{const r=buildRevenueHistory([stay('a','2026-10-29','2026-11-01',300),stay('b','2026-10-01','2026-10-03',200,{bookingStatus:'CANCELLED'}),stay('c','2026-10-01','2026-10-03',200,{guestName:'CLOSED'})],'2026-10-30').at(-1)!;expect(r.occupied).toBe(1);expect(r.grossCents).toBe(10000);expect(r.partial).toBe(true);});
 it('keeps missing amounts separate and suppresses ADR on overlapping nights',()=>{const r=buildRevenueHistory([stay('a','2026-10-01','2026-10-03',0),stay('b','2026-10-01','2026-10-03',200)],'2026-10-30').at(-1)!;expect(r.occupied).toBe(2);expect(r.missing).toBe(2);expect(r.overlaps).toBe(2);expect(r.adrCents).toBeNull();});
 it('uses the physical duration when imported night count is inconsistent',()=>{const r=buildRevenueHistory([stay('a','2026-10-01','2026-10-03',200,{nights:1})],'2026-10-30').at(-1)!;expect(r.grossCents).toBe(20000);expect(r.invalidNights).toBe(2);});
});
