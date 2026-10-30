import { describe, expect, it } from 'vitest';
import { analyzeRevenueControl, type ControlStay } from './analyze';
const now = new Date('2026-10-31T23:30:00Z');
const stay = (id: string, from: string, to: string, extra = {}): ControlStay => ({ id, checkIn: new Date(from), checkOut: new Date(to), bookedAt: null, grossAmount: 0, nights: 2, bookingStatus: 'CONFIRMED', guestName: 'Guest', ...extra });
describe('daily revenue control', () => {
  it('uses Rome day, counts unique nights and excludes cancelled stays and calendar placeholders', () => {
    const r = analyzeRevenueControl([stay('1','2026-11-01','2026-11-03'), stay('2','2026-11-01','2026-11-03'), stay('3','2026-11-03','2026-11-05',{bookingStatus:'CANCELLED'}),stay('4','2026-11-03','2026-11-05',{guestName:'CLOSED'})], [], now);
    expect(r.today).toBe('2026-11-01'); expect(r.windows[0].booked).toBe(2); expect(r.windows[0].overlaps).toBe(2); expect(r.overlaps).toHaveLength(1);
  });
  it('does not treat missing booking dates as zero pickup or missing prices as revenue', () => {
    const r = analyzeRevenueControl([stay('1','2026-11-01','2026-11-03')], [], now);
    expect(r.pickup).toBeNull(); expect(r.unknownAmounts).toBe(1);
  });
  it('excludes owner blocks from sellable nights and handles a fully blocked window', () => {
    const r = analyzeRevenueControl([], [{startDate:new Date('2026-11-01'),endDate:new Date('2026-11-14')}], now);
    expect(r.windows[0].blocked).toBe(14); expect(r.windows[0].occupancy).toBeNull(); expect(r.windows[0].free).toEqual([]);
  });
  it('checkout is exclusive and future booking timestamps do not increase pickup', () => {
    const r = analyzeRevenueControl([stay('1','2026-10-30','2026-11-01',{bookedAt:now}),stay('2','2026-11-02','2026-11-04',{bookedAt:new Date('2026-11-02')})], [], now);
    expect(r.futureCount).toBe(1); expect(r.pickup).toBe(0); expect(r.windows[0].free[0]).toBe('2026-11-01');
  });
});
