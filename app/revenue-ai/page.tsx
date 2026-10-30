import { redirect } from 'next/navigation';
import { OwnerDashboard } from '@/components/owner/OwnerPortal';
import { requireUser, requireRoles } from '@/lib/auth/guards';
export default async function RevenuePage({searchParams}:{searchParams:Promise<{propertyId?:string|string[];from?:string|string[];to?:string|string[]}>}){
 const user=await requireUser();
 if(user.role==='OWNER')return <OwnerDashboard/>;
 await requireRoles(['SUPER_ADMIN','MANAGER']);
 const params=await searchParams;
 const id=typeof params.propertyId==='string'?params.propertyId:'';
 redirect(`/revenue-ai/control${id?'?propertyId='+encodeURIComponent(id):''}`);
}
