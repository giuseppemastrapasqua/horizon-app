import { generateClosedMonth } from "@/lib/finance/generate-closed-month";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=300;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;
 if(!secret || request.headers.get("authorization")!==`Bearer ${secret}`) return Response.json({error:"Accesso non autorizzato"},{status:401});
 const result=await generateClosedMonth();
 return Response.json(result,{status:result.failed.length?500:200});
}
