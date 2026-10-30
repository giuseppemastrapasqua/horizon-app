import { redirect } from 'next/navigation';
import { requireRoles } from '@/lib/auth/guards';
type Params={propertyId?:string|string[];from?:string|string[];to?:string|string[];workspace?:string|string[]};
export default async function LegacyRevenueCalendar({searchParams}:{searchParams:Promise<Params>}){
 await requireRoles(['SUPER_ADMIN','MANAGER']);
 const params=await searchParams;
 const id=typeof params.propertyId==='string'?params.propertyId:'';
 redirect(`/revenue-ai/control${id?'?propertyId='+encodeURIComponent(id):''}`);
}
