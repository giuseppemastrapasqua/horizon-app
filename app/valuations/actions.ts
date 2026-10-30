'use server';
import {redirect} from 'next/navigation';
import {requireRoles} from '@/lib/auth/guards';
import {revalidatePath} from 'next/cache';
import {loadValuation,saveValuation} from '@/lib/valuations/store';
import {valuationSchema} from '@/lib/valuations/model';
export async function saveValuationAction(_previous:{error:string},data:FormData){
 await requireRoles(['SUPER_ADMIN','MANAGER']);
 let saved:{id:string;currentVersion:number};
 try{
  const json=String(data.get('payload')??'');if(json.length>300000)throw new Error('La scheda supera la dimensione massima.');
  const input=valuationSchema.safeParse(JSON.parse(json));if(!input.success)throw new Error(input.error.issues[0]?.message??'Dati non validi.');
  const id=String(data.get('id')??'')||undefined,version=Number(data.get('version'));
  if(id&&(!Number.isInteger(version)||version<1))throw new Error('Versione non valida.');
  saved=await saveValuation(input.data,id,version);
 }catch(e){return {error:e instanceof Error?e.message:'Salvataggio non riuscito.'};}
 revalidatePath('/valuations');redirect(`/valuations/${saved.id}?saved=1`);
}
export async function duplicateValuationAction(data:FormData){
 const {snapshot}=await loadValuation(String(data.get('id')??''));
 const saved=await saveValuation({...snapshot.input,name:(snapshot.input.name+' - copia').slice(0,160),state:'DRAFT'});
 revalidatePath('/valuations');redirect(`/valuations/${saved.id}`);
}
