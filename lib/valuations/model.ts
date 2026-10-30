import { z } from 'zod';
const amount=z.number().finite().min(0).max(1000000);
const optionalAmount=amount.nullable();
const percent=z.number().finite().min(0).max(95);
const day=z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).refine(s=>{const d=new Date(s+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===s;},'Data non valida');
export const valuationSchema=z.object({
 name:z.string().trim().min(2,'Indica un nome per la valutazione').max(160),ownerName:z.string().max(160),ownerEmail:z.union([z.literal(''),z.email()]),
 propertyId:z.string().max(100),address:z.string().max(250),city:z.string().max(100),zone:z.string().max(120),sqm:optionalAmount,floor:z.string().max(30),elevator:z.enum(['YES','NO','UNKNOWN']),bedrooms:z.number().int().min(0).max(30).nullable(),bathrooms:z.number().int().min(0).max(30).nullable(),maxGuests:z.number().int().min(1).max(16),baseGuests:z.number().int().min(1).max(16),
 amenities:z.string().max(3000),strengths:z.string().max(3000),limits:z.string().max(3000),targetGuest:z.string().max(1000),photoUrls:z.array(z.string().max(2000).refine(s=>/^https:\/\//.test(s)||s.startsWith('/'),'Usa un collegamento https o interno')).max(20),existingListing:z.string().max(2000),stage:z.enum(['NEW','OPERATING']),
 year:z.number().int().min(2026).max(2035),monthlyBase:z.array(optionalAmount).length(12),monthlyOccupancy:z.array(z.number().finite().min(0).max(100)).length(12),minimum:z.number().positive().max(100000).nullable(),maximum:z.number().positive().max(100000).nullable(),extraGuestFee:amount,weekend:percent,minimumStay:z.number().int().min(1).max(60),averageStay:z.number().finite().min(1).max(60),
 cleaningCost:optionalAmount,cleaningCharge:optionalAmount,otherMonthly:amount,management:percent,vat:percent,vatMode:z.enum(['NONE','INCLUDED','EXCLUDED']),targetMonthly:optionalAmount,
 channels:z.array(z.object({code:z.enum(['DIRECT','BOOKING','AIRBNB']),commission:percent.nullable(),promotion:percent})).length(3),forecastChannel:z.enum(['DIRECT','BOOKING','AIRBNB']),forecastGuests:z.number().int().min(1).max(16),
 source:z.string().max(10000),sourcesVerified:z.boolean(),launchFrom:z.union([z.literal(''),day]),launchTo:z.union([z.literal(''),day]),launchDiscount:percent,events:z.array(z.object({from:day,to:day,label:z.string().min(1).max(120),percent:z.number().finite().min(-80).max(300),source:z.string().min(1).max(1000)})).max(40),
 overrides:z.array(z.object({date:day,price:z.number().positive().max(100000),reason:z.string().min(3).max(300)})).max(366),internalNotes:z.string().max(5000),state:z.enum(['DRAFT','REVIEW','READY','SENT']),
}).superRefine((v,c)=>{
 const fail=(message:string)=>c.addIssue({code:'custom',message});
 if(v.baseGuests>v.maxGuests||v.forecastGuests>v.maxGuests)fail('Gli ospiti inclusi e quelli dello scenario non possono superare la capienza.');
 if(v.maximum!==null&&v.minimum!==null&&v.maximum<v.minimum)fail('Il massimo deve essere almeno pari al minimo.');
 if(new Set(v.channels.map(x=>x.code)).size!==3)fail('I tre canali devono essere distinti.');
 if(new Set(v.overrides.map(x=>x.date)).size!==v.overrides.length)fail('Esistono correzioni duplicate per la stessa notte.');
 if(v.management*(v.vatMode==='EXCLUDED'?1+v.vat/100:1)>=100)fail('La commissione complessiva di gestione deve essere inferiore al 100%.');
 if(Boolean(v.launchFrom)!==Boolean(v.launchTo)||v.launchFrom>v.launchTo)fail('Completa correttamente il periodo di lancio.');
 if(v.launchFrom&&(!v.launchFrom.startsWith(String(v.year))||!v.launchTo.startsWith(String(v.year))))fail('Il lancio deve appartenere all’anno valutato.');
 if(v.launchDiscount>0&&!v.launchFrom)fail('Lo sconto di lancio richiede le date.');
 for(const e of v.events)if(e.to<e.from||!e.from.startsWith(String(v.year))||!e.to.startsWith(String(v.year)))fail('Gli eventi devono essere ordinati e appartenere all’anno valutato.');
 for(const o of v.overrides)if(!o.date.startsWith(String(v.year)))fail('Le correzioni devono appartenere all’anno valutato.');
});
export type ValuationInput=z.infer<typeof valuationSchema>;
export const monthNames=['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
export function emptyValuation():ValuationInput{return {name:'Nuova valutazione',ownerName:'',ownerEmail:'',propertyId:'',address:'',city:'Milano',zone:'',sqm:null,floor:'',elevator:'UNKNOWN',bedrooms:null,bathrooms:null,maxGuests:2,baseGuests:2,amenities:'',strengths:'',limits:'',targetGuest:'',photoUrls:[],existingListing:'',stage:'NEW',year:2027,monthlyBase:Array(12).fill(null),monthlyOccupancy:Array(12).fill(65),minimum:null,maximum:null,extraGuestFee:0,weekend:0,minimumStay:2,averageStay:3,cleaningCost:null,cleaningCharge:null,otherMonthly:0,management:20,vat:22,vatMode:'INCLUDED',targetMonthly:null,channels:[{code:'DIRECT',commission:0,promotion:0},{code:'BOOKING',commission:null,promotion:0},{code:'AIRBNB',commission:null,promotion:0}],forecastChannel:'BOOKING',forecastGuests:2,source:'',sourcesVerified:false,launchFrom:'',launchTo:'',launchDiscount:0,events:[],overrides:[],internalNotes:'',state:'DRAFT'};}
