import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(()=>({roles:vi.fn(),scope:vi.fn(),properties:vi.fn(),bookings:vi.fn()}));
vi.mock('@/lib/auth/guards',()=>({requireRoles:m.roles,getAccessiblePropertyIds:m.scope}));
vi.mock('@/lib/prisma',()=>({prisma:{property:{findMany:m.properties},booking:{findMany:m.bookings}}}));
vi.mock('@/components/AppShell',()=>({AppShell:()=>null}));
vi.mock('@/components/Navigation',()=>({Navigation:()=>null}));
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('404')}}));
import Page from './page';
describe('revenue control access',()=>{
 beforeEach(()=>{vi.resetAllMocks();m.scope.mockResolvedValue(['own']);m.properties.mockResolvedValue([{id:'own',name:'Own'}]);});
 it('denies owner and operator roles before reading data',async()=>{m.roles.mockRejectedValue(new Error('denied'));await expect(Page({searchParams:Promise.resolve({})})).rejects.toThrow('denied');expect(m.roles).toHaveBeenCalledWith(['SUPER_ADMIN','MANAGER']);expect(m.properties).not.toHaveBeenCalled();});
 it('rejects foreign properties before reading their bookings',async()=>{await expect(Page({searchParams:Promise.resolve({propertyId:'foreign'})})).rejects.toThrow('404');expect(m.properties.mock.calls[0][0].where).toEqual({status:'ACTIVE',id:{in:['own']}});expect(m.bookings).not.toHaveBeenCalled();});
});
