import { describe,it,expect,vi } from 'vitest';
const findMany=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/prisma',()=>({prisma:{financeReport:{findMany}}}));
import {ownerShareKey,quotaOnlyPropertyIds,ownerQuotaReports} from './revenue-share-access';
const snapshot={revenueSplit:{effectiveFrom:'2026-10-01',recipients:[{key:'silvia',name:'Silvia',basisPoints:7500,userId:'s'},{key:'fabio',name:'Flavio',basisPoints:2500,userId:'f'}]}};
describe('owner quota isolation',()=>{
 it('resolves the authenticated recipient and excludes unrelated accounts and earlier months',()=>{
  expect(ownerShareKey(snapshot,new Date('2026-10-01'),'f')).toBe('fabio');
  expect(ownerShareKey(snapshot,new Date('2026-10-01'),'s')).toBe('silvia');
  expect(ownerShareKey(snapshot,new Date('2026-10-01'),'other')).toBeNull();
  expect(ownerShareKey(snapshot,new Date('2026-09-01'),'f')).toBeNull();
 });
 it('scopes restricted properties by user id inside the saved policy',async()=>{
  findMany.mockResolvedValueOnce([{propertyId:'p'},{propertyId:'p'}]);
  expect(await quotaOnlyPropertyIds('f')).toEqual(['p']);
  expect(findMany.mock.calls.at(-1)?.[0].where.formulaSnapshot.array_contains).toEqual([{userId:'f'}]);
 });
 it('does not give a co-owner the primary owners September history',async()=>{
  findMany.mockResolvedValueOnce([{propertyId:'p'}]).mockResolvedValueOnce([{id:'sept',ownerId:'s',referenceMonth:new Date('2026-09-01'),formulaSnapshot:{}},{id:'oct',ownerId:'s',referenceMonth:new Date('2026-10-01'),formulaSnapshot:snapshot}]);
  expect((await ownerQuotaReports('f')).map(r=>r.id)).toEqual(['oct']);
 });
});
