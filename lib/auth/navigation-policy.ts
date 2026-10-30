export const ownerNavigationPaths = ['/dashboard','/calendar','/bookings','/documents','/tasks'] as const;
export const adminNavigationPaths = ['/dashboard','/calendar','/bookings','/properties','/tasks','/accounting','/revenue-ai','/management'] as const;
export function navigationForRole<T extends {href:string;operatorVisible:boolean}>(items:T[],role?:string):T[]{
 if(!role)return [];
 if(role==='OWNER')return ownerNavigationPaths.flatMap(path=>items.filter(item=>item.href===path));
 if(role==='OPERATOR')return items.filter(item=>item.operatorVisible&&['/calendar','/bookings','/tasks','/reports/cleaning'].includes(item.href));
 if(!['SUPER_ADMIN','MANAGER','FINANCE_ADMIN'].includes(role))return [];
 return adminNavigationPaths.filter(path=>path!=='/revenue-ai'||['SUPER_ADMIN','MANAGER'].includes(role)).flatMap(path=>items.filter(item=>item.href===path));
}
export function navigationSection(pathname:string,role?:string){
 if(role==='OWNER'||role==='OPERATOR')return pathname;
 const accounting=['/business-accounting','/reports/finance','/reports/monthly','/reports/cleaning','/reports/tourist-tax','/invoices','/documents','/accounting'];
 if(accounting.some(p=>pathname===p||pathname.startsWith(p+'/')))return '/accounting';
 if(['/owners','/collaborators','/settings','/management'].some(p=>pathname===p||pathname.startsWith(p+'/')))return '/management';
 if(pathname==='/calendar/revenue-ai'||pathname.startsWith('/calendar/revenue-ai/'))return '/revenue-ai';
 if(pathname==='/rate-types'||pathname.startsWith('/rate-types/'))return role==='FINANCE_ADMIN'?'/management':'/revenue-ai';
 if(pathname.startsWith('/revenue-ai'))return '/revenue-ai';
 if(pathname==='/activation'||pathname.startsWith('/activation/'))return '/properties';
 return pathname;
}
