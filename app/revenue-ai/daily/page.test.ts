import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({roles:vi.fn(),redirect:vi.fn()}));
vi.mock('@/lib/auth/guards',()=>({requireRoles:m.roles}));
vi.mock('next/navigation',()=>({redirect:m.redirect}));
import Daily from './page';
import Calendar from '../../calendar/revenue-ai/page';
describe('retired revenue entry points',()=>{
 beforeEach(()=>{vi.resetAllMocks();});
 it.each([Daily,Calendar])('requires manager permissions and preserves the selected property',async(Page)=>{await Page({searchParams:Promise.resolve({propertyId:'property & 1'})});expect(m.roles).toHaveBeenCalledWith(['SUPER_ADMIN','MANAGER']);expect(m.redirect).toHaveBeenCalledWith('/revenue-ai/control?propertyId=property%20%26%201');});
 it('does not redirect unauthorized users into a workspace',async()=>{m.roles.mockRejectedValue(new Error('denied'));await expect(Daily({searchParams:Promise.resolve({})})).rejects.toThrow('denied');expect(m.redirect).not.toHaveBeenCalled();});
});
