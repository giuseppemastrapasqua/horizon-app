import {describe,it,expect} from 'vitest';
import {emptyValuation} from './model';
import {buildValuation} from './engine';
import {compareValuationActual} from './actual';
import type {ControlStay} from '@/lib/revenue/control/analyze';
const stay=(id:string,from:string,to:string,grossAmount:number,extra={}):ControlStay=>({id,checkIn:new Date(from),checkOut:new Date(to),grossAmount,nights:(Date.parse(to)-Date.parse(from))/86400000,bookedAt:null,guestName:'',bookingStatus:'CONFIRMED',...extra});
const v={...emptyValuation(),year:2026};
const compare=(stays:ControlStay[],savedAt='2026-09-01T00:00:00Z')=>compareValuationActual(v,buildValuation(v),savedAt,stays,new Date('2026-10-30T10:00:00Z'));
describe('valuation versus actual physical nights',()=>{
 it('allocates cross-month cents and excludes cancellations and future nights',()=>{const r=compare([stay('a','2026-09-30','2026-10-03',100),stay('b','2026-10-01','2026-10-03',999,{bookingStatus:'CANCELLED'}),stay('c','2026-10-30','2026-11-03',400)]);expect(r[8].gross).toBe(33.34);expect(r[9].gross).toBe(66.66);expect(r[9].nights).toBe(2);expect(r[10].gross).toBeNull();});
 it('does not invent zero revenue without activity or when amounts overlap or are missing',()=>{expect(compare([])[9].gross).toBeNull();expect(compare([stay('a','2026-10-01','2026-10-03',0)])[9].gross).toBeNull();expect(compare([stay('a','2026-10-01','2026-10-03',100),stay('b','2026-10-01','2026-10-03',200)])[9].gross).toBeNull();});
 it('labels a retrospective baseline and never calls it a prediction',()=>{const r=compare([stay('a','2026-10-01','2026-10-03',100)],'2026-10-30T00:00:00Z');expect(r[9].kind).toBe('RETROSPETTIVO');expect(r[9].delta).toBeNull();});
 it('counts elapsed days using Rome and flags inconsistent imported night counts',()=>{const r=compare([stay('a','2026-10-01','2026-10-03',100,{nights:1})]);expect(r[9].elapsed).toBe(29);expect(r[9].invalid).toBeGreaterThan(0);expect(r[9].gross).toBeNull();});
});
