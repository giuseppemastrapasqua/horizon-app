import { describe, expect, it } from 'vitest';
import { readRevenueSplit, splitCents, splitStatement } from './report-revenue-split';
import { buildPropertyMonthlyStatement } from './property-monthly-statement';
import { createReportBookingSnapshot } from './report-booking-snapshot';
const statementFixture=()=>({id:'r',referenceMonth:new Date('2026-10-01'),createdAt:new Date('2026-11-01'),currency:'EUR',grossRevenue:500,finalAmount:209.03,property:{name:'Test',address:'Test',city:'Milano'},owner:{fullName:'Proprietario di prova'},adjustments:[],formulaSnapshot:{bookingDetail:createReportBookingSnapshot([{id:'b',checkIn:new Date('2026-10-01'),checkOut:new Date('2026-10-03'),nights:2,guests:2,channel:'BOOKING',currency:'EUR'}],[{grossBooking:500,otaCommission:100,cleaningCost:50,grossProperty:350,managementCommission:70,managementCommissionTaxableBase:70,managementCommissionVat:15.4,managementCommissionTotal:85.4,taxAmount:55.566,otherAmount:null,netProperty:209.034}])}});
const split={effectiveFrom:'2026-10-01',recipients:[{key:'silvia',name:'Silvia Graziottin',basisPoints:7500},{key:'fabio',name:'Fabio Graziottin',basisPoints:2500}]};
describe('report revenue split',()=>{
 it('applies from October and rejects invalid totals',()=>{
  expect(readRevenueSplit({revenueSplit:split},new Date('2026-09-01'))).toBeNull();
  expect(readRevenueSplit({revenueSplit:split},new Date('2026-10-01'))).toEqual(split);
  expect(()=>readRevenueSplit({revenueSplit:{...split,recipients:split.recipients.slice(0,1)}},new Date('2026-10-01'))).toThrow();
 });
 it('preserves every cent, including negative adjustments and odd cents',()=>{
  for(const value of [0,1,3,165179,-1,-301,988312]) expect(splitCents(value,split,0)+splitCents(value,split,1)).toBe(value);
 });
 it('splits all saved statement amounts and preserves dates and source report',()=>{
  const original=buildPropertyMonthlyStatement(statementFixture());
  const a=splitStatement(original,split,0),b=splitStatement(original,split,1);
  expect(a.report.owner.fullName).toBe('Silvia Graziottin');expect(b.report.owner.fullName).toBe('Fabio Graziottin');
  expect(a.payable+b.payable).toBe(original.payable);
  for(const k of Object.keys(original.totals) as (keyof typeof original.totals)[]) expect(a.totals[k]!+b.totals[k]!).toBe(original.totals[k]);
  expect(a.rows[0].checkIn).toEqual(original.rows[0].checkIn);expect(original.report.owner.fullName).toBe('Proprietario di prova');
 });
});
