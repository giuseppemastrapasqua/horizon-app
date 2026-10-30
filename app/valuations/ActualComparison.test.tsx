import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({roles:vi.fn(),scope:vi.fn(),bookings:vi.fn()}));
vi.mock('@/lib/auth/guards',()=>({requireRoles:m.roles,getAccessiblePropertyIds:m.scope}));
vi.mock('@/lib/prisma',()=>({prisma:{booking:{findMany:m.bookings}}}));
import {ActualComparison} from './ActualComparison';
import {emptyValuation} from '@/lib/valuations/model';
import {buildValuation} from '@/lib/valuations/engine';
const input={...emptyValuation(),propertyId:'own'};
const snapshot={schemaVersion:1 as const,input,result:buildValuation(input),savedAt:'2026-10-30T10:00:00Z',authorName:'Manager'};
describe('valuation actual data access',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.scope.mockResolvedValue(['own']);m.bookings.mockResolvedValue([]);});
 it('denies roles before reading bookings',async()=>{m.roles.mockRejectedValue(new Error('denied'));await expect(ActualComparison({snapshot})).rejects.toThrow('denied');expect(m.bookings).not.toHaveBeenCalled();});
 it('does not expose a linked property when its access has been revoked',async()=>{m.scope.mockResolvedValue(['other']);await ActualComparison({snapshot});expect(m.bookings).not.toHaveBeenCalled();});
 it('queries only the authorized property and active stays without guest personal fields',async()=>{await ActualComparison({snapshot});const q=m.bookings.mock.calls[0][0];expect(q.where.propertyId).toBe('own');expect(q.where.bookingStatus.in).toEqual(['CONFIRMED','CHECKED_IN','CHECKED_OUT']);expect(q.where.guestName).toEqual({not:'CLOSED'});expect(q.select.guestName).toBeUndefined();expect(q.select.guestEmail).toBeUndefined();});
});
