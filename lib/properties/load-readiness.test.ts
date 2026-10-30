import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({roles:vi.fn(),scope:vi.fn(),properties:vi.fn()}));
vi.mock('@/lib/auth/guards',()=>({requireRoles:m.roles,getAccessiblePropertyIds:m.scope}));
vi.mock('@/lib/prisma',()=>({prisma:{property:{findMany:m.properties}}}));
import {loadPropertyReadiness} from './load-readiness';
describe('property readiness access',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.scope.mockResolvedValue(['own']);m.properties.mockResolvedValue([]);});
 it('denies unauthorized roles before querying',async()=>{m.roles.mockRejectedValue(new Error('denied'));await expect(loadPropertyReadiness()).rejects.toThrow('denied');expect(m.properties).not.toHaveBeenCalled();});
 it('scopes all nested counts through authorized properties and excludes cancelled stays',async()=>{await loadPropertyReadiness();const q=m.properties.mock.calls[0][0];expect(q.where).toEqual({status:{not:'ARCHIVED'},id:{in:['own']}});expect(q.select._count.select.bookings.where.bookingStatus.in).toEqual(['CONFIRMED','CHECKED_IN','CHECKED_OUT']);expect(q.select.integrationConnections.select.connection.select.config).toBeUndefined();});
});
