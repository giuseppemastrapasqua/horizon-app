import { requireRoles, getAccessiblePropertyIds } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';
export async function loadPropertyReadiness(){
 await requireRoles(['SUPER_ADMIN','MANAGER','FINANCE_ADMIN']);
 const ids=await getAccessiblePropertyIds();
 const now=new Date();
 return prisma.property.findMany({
  where:{status:{not:'ARCHIVED'},...(ids===null?{}:{id:{in:ids}})},orderBy:{name:'asc'},
  select:{id:true,name:true,address:true,maxGuests:true,bedrooms:true,bathrooms:true,cleaningCost:true,propertyManagementCommissionPercent:true,
   ratePlans:{where:{active:true,currency:'EUR'},select:{basePrice:true}},
   channelCommissions:{select:{channel:true,commissionPercent:true}},
   integrationConnections:{where:{connection:{enabled:true}},select:{connection:{select:{connectorKey:true,lastSyncAt:true,lastSyncStatus:true}}}},
   _count:{select:{images:true,bookings:{where:{checkOut:{gte:now},bookingStatus:{in:['CONFIRMED','CHECKED_IN','CHECKED_OUT']},guestName:{not:'CLOSED'},grossAmount:{lte:0}}}}},
  },
 });
}
