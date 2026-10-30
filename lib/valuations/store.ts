import {createHmac,randomUUID} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {notFound} from 'next/navigation';
import {requireRoles,requirePropertyAccess} from '@/lib/auth/guards';
import {prisma} from '@/lib/prisma';
import {encryptCredential,decryptCredential} from '@/lib/security/credential-crypto';
import {buildValuation,type ValuationResult} from './engine';
import {valuationSchema,type ValuationInput} from './model';
export const VALUATION_PREFIX='valuation:';
export type ValuationSnapshot={schemaVersion:1;input:ValuationInput;result:ValuationResult;savedAt:string;authorName:string};
const key=()=>{const k=process.env.HORIZON_BILLING_ENCRYPTION_KEY;if(!k)throw new Error('Cifratura non configurata: valutazione non salvata.');return k;};
export function valuationSearchTokens(query:string){
 return [...new Set(query.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(word=>createHmac('sha256',Buffer.from(key(),'base64')).update('valuation-search:'+word.slice(0,40)).digest('hex')))];
}
export function packValuation(snapshot:ValuationSnapshot,createdById:string):Prisma.InputJsonValue{const v=snapshot.input;
 const words=[v.name,v.ownerName,v.address,v.city,v.zone].join(' ').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
 const prefixes=words.flatMap(word=>Array.from({length:Math.min(40,word.length)},(_,i)=>word.slice(0,i+1)));
 return {kind:'PROPERTY_VALUATION',createdById,state:v.state,searchTokens:valuationSearchTokens(prefixes.join(' ')),payload:encryptCredential(JSON.stringify(snapshot),key())};}
export function unpackValuation(content:Prisma.JsonValue):ValuationSnapshot{
 const v=content as {kind?:string;payload?:string};
 if(v?.kind!=='PROPERTY_VALUATION'||!v.payload)throw new Error('Valutazione non valida.');
 const snapshot=JSON.parse(decryptCredential(v.payload,key())) as ValuationSnapshot;
 if(snapshot.schemaVersion!==1||snapshot.result.engine!=='valuation-v1')throw new Error('Versione valutazione non supportata.');
 snapshot.input=valuationSchema.parse(snapshot.input);return snapshot;
}
export function valuationScope(user:{id:string;role:string}):Prisma.DocumentWhereInput{return {documentKey:{startsWith:VALUATION_PREFIX},type:'PROPERTY_REPORT',...(user.role==='SUPER_ADMIN'?{}:{content:{path:['createdById'],equals:user.id}})};}
export async function loadValuation(id:string,version?:number){
 const user=await requireRoles(['SUPER_ADMIN','MANAGER']);
 const document=await prisma.document.findFirst({where:{id,...valuationScope(user)},include:{versions:{orderBy:{version:'desc'},select:{version:true,createdAt:true,note:true}}}});
 if(!document)notFound();
 let content=document.content;
 if(version!==undefined){const rev=await prisma.documentVersion.findUnique({where:{documentId_version:{documentId:document.id,version}},select:{content:true}});if(!rev)notFound();content=rev.content;}
 return {document,snapshot:unpackValuation(content),version:version??document.currentVersion,user};
}
export async function saveValuation(input:ValuationInput,id?:string,expectedVersion?:number){
 const user=await requireRoles(['SUPER_ADMIN','MANAGER']);
 const parsed=valuationSchema.parse(input);
 if(parsed.propertyId)await requirePropertyAccess(parsed.propertyId);
 const result=buildValuation(parsed);
 if(['READY','SENT'].includes(parsed.state)&&result.missing.length)throw new Error('Completa i dati e verifica i riferimenti prima di impostare Pronta o Inviata.');
 const snapshot:ValuationSnapshot={schemaVersion:1,input:parsed,result,savedAt:new Date().toISOString(),authorName:user.name??'Gestore Horizon'};
 return prisma.$transaction(async tx=>{
  if(!id){const content=packValuation(snapshot,user.id);return tx.document.create({data:{type:'PROPERTY_REPORT',status:'DRAFT',title:parsed.name,documentKey:VALUATION_PREFIX+randomUUID(),content,versions:{create:{version:1,content,note:'Prima valutazione',createdByName:user.name??null}}},select:{id:true,currentVersion:true}});}
  const current=await tx.document.findFirst({where:{id,...valuationScope(user)},select:{id:true,currentVersion:true,content:true}});
  if(!current)throw new Error('Valutazione non trovata o non autorizzata.');
  if(current.currentVersion!==expectedVersion)throw new Error('La valutazione è stata modificata: ricarica prima di salvare.');
  const author=(current.content as {createdById:string}).createdById;
  const content=packValuation(snapshot,author),version=current.currentVersion+1;
  const updated=await tx.document.updateMany({where:{id,currentVersion:expectedVersion},data:{title:parsed.name,content,currentVersion:version,status:'DRAFT'}});
  if(updated.count!==1)throw new Error('Salvataggio concorrente: ricarica la valutazione.');
  await tx.documentVersion.create({data:{documentId:id,version,content,note:`Revisione ${version} · ${parsed.state==='SENT'?'invio manuale dichiarato':parsed.state}`,createdByName:user.name??null}});
  return {id,currentVersion:version};
 });
}
