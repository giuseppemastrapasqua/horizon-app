import {loadValuation} from '@/lib/valuations/store';
import {buildValuationPdf} from '@/lib/valuations/pdf';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params,url=new URL(request.url),raw=url.searchParams.get('version');
 const version=raw===null?undefined:Number(raw);
 if(version!==undefined&&(!Number.isInteger(version)||version<1))return new Response('Versione non valida.',{status:400});
 const {snapshot,version:selected}=await loadValuation(id,version);
 const mode=url.searchParams.get('mode')??'summary';if(!['summary','full'].includes(mode))return new Response('Formato non valido.',{status:400});
 const pdf=await buildValuationPdf(snapshot,selected,mode==='full');
 return new Response(Buffer.from(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Valutazione_${snapshot.input.year}_v${selected}_${mode}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
