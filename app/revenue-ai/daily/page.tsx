import { redirect } from 'next/navigation';
import { requireRoles } from '@/lib/auth/guards';
export default async function LegacyDailyRevenue({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 await requireRoles(['SUPER_ADMIN','MANAGER']);
 const params=await searchParams;
 const propertyId=typeof params.propertyId==='string'?params.propertyId:'';
 redirect(`/revenue-ai/control${propertyId?'?propertyId='+encodeURIComponent(propertyId):''}`);
}
