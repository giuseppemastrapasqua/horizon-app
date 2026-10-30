import {expect,it} from 'vitest';
import {navigationForRole} from '@/lib/auth/navigation-policy';
import {sectionsForRole} from '@/lib/workspace/sections';
it('moves activation under management for admins and managers, preserving the owner menu',()=>{
 const items=['/dashboard','/calendar','/bookings','/documents','/tasks','/activation','/management'].map(href=>({href,operatorVisible:true}));
 for(const role of ['SUPER_ADMIN','MANAGER']){
  expect(navigationForRole(items,role).some(item=>item.href==='/activation')).toBe(false);
  expect(sectionsForRole('management',role).some(item=>item.href==='/activation')).toBe(true);
 }
 for(const role of ['OWNER','OPERATOR','FINANCE_ADMIN','SYSTEM_AI'])expect(sectionsForRole('management',role).some(item=>item.href==='/activation')).toBe(false);
 expect(navigationForRole(items,'OPERATOR').some(item=>item.href==='/activation')).toBe(false);
 expect(navigationForRole(items,'OWNER').map(item=>item.href)).toEqual(['/dashboard','/calendar','/bookings','/documents','/tasks']);
});
