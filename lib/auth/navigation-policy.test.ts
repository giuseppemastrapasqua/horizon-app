import {describe,it,expect} from 'vitest';
import {navigationForRole,navigationSection} from './navigation-policy';
import {sectionsForRole} from '../workspace/sections';
const paths=['/dashboard','/calendar','/bookings','/properties','/tasks','/accounting','/revenue-ai','/management','/documents','/reports/cleaning'];
const items=paths.map(href=>({href,operatorVisible:['/calendar','/bookings','/tasks','/reports/cleaning'].includes(href)}));
describe('workspace navigation',()=>{
 it('keeps the exact five owner entries in order',()=>{expect(navigationForRole(items,'OWNER').map(x=>x.href)).toEqual(['/dashboard','/calendar','/bookings','/documents','/tasks']);});
 it('preserves the operational access list without exposing finance or management',()=>{expect(navigationForRole(items,'OPERATOR').map(x=>x.href)).toEqual(['/calendar','/bookings','/tasks','/reports/cleaning']);});
 it('shows eight consolidated admin entries and hides revenue for finance',()=>{expect(navigationForRole(items,'SUPER_ADMIN')).toHaveLength(8);expect(navigationForRole(items,'FINANCE_ADMIN').some(x=>x.href==='/revenue-ai')).toBe(false);});
 it('does not expose restricted hub links to managers or finance users',()=>{for(const role of ['MANAGER','FINANCE_ADMIN']){expect(sectionsForRole('accounting',role).some(x=>x.href==='/business-accounting')).toBe(false);expect(sectionsForRole('management',role).some(x=>x.href==='/collaborators')).toBe(false);}});
 it('groups child routes while preserving owners and operators active entries',()=>{expect(navigationSection('/invoices/abc','SUPER_ADMIN')).toBe('/accounting');expect(navigationSection('/collaborators','SUPER_ADMIN')).toBe('/management');expect(navigationSection('/documents','OWNER')).toBe('/documents');expect(navigationSection('/reports/cleaning','OPERATOR')).toBe('/reports/cleaning');});
 it('returns no links for unknown roles',()=>{expect(navigationForRole(items)).toEqual([]);expect(navigationForRole(items,'other')).toEqual([]);});
});
