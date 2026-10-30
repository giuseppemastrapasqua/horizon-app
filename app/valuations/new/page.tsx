import {ActualComparison} from '../ActualComparison';
import {buildValuation} from '@/lib/valuations/engine';
import {notFound} from 'next/navigation';
import {Navigation} from '@/components/Navigation';
import {AppShell} from '@/components/AppShell';
import {requireRoles,getAccessiblePropertyIds} from '@/lib/auth/guards';
import {prisma} from '@/lib/prisma';
import {emptyValuation} from '@/lib/valuations/model';
import {ValuationEditor} from '../ValuationEditor';
export default async function NewValuation({searchParams}:{searchParams:Promise<{propertyId?:string}>}){
 await requireRoles(['SUPER_ADMIN','MANAGER']);const ids=await getAccessiblePropertyIds();const params=await searchParams;
 const properties=await prisma.property.findMany({where:{status:{not:'ARCHIVED'},...(ids===null?{}:{id:{in:ids}})},select:{id:true,name:true,address:true,city:true,zone:true,bedrooms:true,bathrooms:true,maxGuests:true,baseGuests:true,extraGuestFee:true,cleaningCost:true,propertyManagementCommissionPercent:true,propertyManagementCommissionVatMode:true,propertyManagementCommissionVatPercent:true,channelCommissions:{select:{channel:true,commissionPercent:true}},images:{orderBy:{sortOrder:'asc'},take:20,select:{url:true}}},orderBy:{name:'asc'}});
 const initial=emptyValuation();
 if(params.propertyId){const p=properties.find(p=>p.id===params.propertyId);if(!p)notFound();Object.assign(initial,{name:p.name,propertyId:p.id,address:p.address,city:p.city,zone:p.zone??'',bedrooms:p.bedrooms,bathrooms:p.bathrooms,maxGuests:p.maxGuests,baseGuests:Math.min(p.baseGuests,p.maxGuests),forecastGuests:Math.min(p.baseGuests,p.maxGuests),extraGuestFee:Number(p.extraGuestFee),cleaningCost:Number(p.cleaningCost),management:Number(p.propertyManagementCommissionPercent),vat:Number(p.propertyManagementCommissionVatPercent),vatMode:p.propertyManagementCommissionVatMode,stage:'OPERATING',photoUrls:p.images.map(i=>i.url),source:'Dati descrittivi e costi importati dalla scheda Horizon. Riferimenti di mercato ancora da inserire.'});initial.channels=initial.channels.map(c=>({...c,commission:c.code==='DIRECT'?0:(p.channelCommissions.find(p=>p.channel===c.code)?Number(p.channelCommissions.find(p=>p.channel===c.code)!.commissionPercent):null)}));}
 return <><Navigation/><AppShell title="Nuova valutazione immobile" subtitle="Salva la bozza in qualsiasi momento. I dati possono essere completati progressivamente."><form className="mb-6 flex flex-wrap items-end gap-3"><label className="text-sm">Parti da un alloggio esistente<select name="propertyId" defaultValue={params.propertyId??''} className="ml-3 rounded-xl bg-[#152330] p-3"><option value="">Nuovo immobile da acquisire</option>{properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button className="rounded-xl border border-white/15 px-4 py-3">Carica dati</button></form><ValuationEditor key={params.propertyId??'new'} initial={initial}/>{initial.propertyId&&<ActualComparison saved={false} snapshot={{schemaVersion:1,input:initial,result:buildValuation(initial),savedAt:new Date().toISOString(),authorName:''}}/>}</AppShell></>;
}
