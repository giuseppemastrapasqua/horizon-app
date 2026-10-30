import {describe,it,expect} from 'vitest';
import {dashboardDay,operationalBookings,bookedTonight} from './today';
const b=(start:string,end:string,extra={})=>({checkIn:new Date(start),checkOut:new Date(end),bookingStatus:'CONFIRMED',guestName:'Guest',...extra});
describe('dashboard operational availability',()=>{
 it('uses Rome date across UTC day boundary',()=>{expect(dashboardDay(new Date('2026-10-31T23:30:00Z')).start.toISOString()).toBe('2026-11-01T00:00:00.000Z');});
 it('excludes pending stays, cancelled stays and closed placeholders',()=>{expect(operationalBookings([b('2026-10-30','2026-11-01',{bookingStatus:'CANCELLED'}),b('2026-10-30','2026-11-01',{bookingStatus:'PENDING'}),b('2026-10-30','2026-11-01',{guestName:'CLOSED'})])).toEqual([]);});
 it('occupies arrival night and frees checkout night',()=>{const {start,end}=dashboardDay(new Date('2026-10-30T10:00:00Z'));expect(bookedTonight([b('2026-10-30','2026-11-01')],start,end)).toBe(true);expect(bookedTonight([b('2026-10-28','2026-10-30')],start,end)).toBe(false);});
});
