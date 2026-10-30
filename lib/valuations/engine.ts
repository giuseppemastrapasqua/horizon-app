import {valuationSchema,type ValuationInput} from './model';
export const VALUATION_ENGINE='valuation-v1';
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const up=(n:number)=>Math.ceil((n-1e-9)*100)/100;
export type ValuationDay={date:string;month:number;base:number|null;prices:{guests:number;channels:{code:ValuationInput['channels'][number]['code'];list:number|null;payable:number|null;cleaning:number|null}[]}[];minimumStay:number;limited:boolean;reason:string};
export function valuationMissing(v:ValuationInput){
 const m:string[]=[];
 if(!v.address.trim()||!v.city.trim()||!v.sqm||v.bedrooms===null||!v.bathrooms)m.push('Completare indirizzo, metratura, camere e bagni.');
 if(v.monthlyBase.some(x=>x===null||x<=0))m.push('Definire riferimenti positivi per tutti i 12 mesi.');
 if(v.minimum===null||v.maximum===null)m.push('Definire prezzo minimo e massimo.');
 if(v.cleaningCost===null||v.cleaningCharge===null)m.push('Completare costo e addebito pulizie.');
 if(v.channels.some(x=>x.commission===null))m.push('Completare le commissioni dei tre canali.');
 if(!v.source.trim()||!v.sourcesVerified)m.push('Documentare e confermare i riferimenti di prezzo.');
 if(v.averageStay<v.minimumStay)m.push('La durata media deve essere compatibile con il soggiorno minimo.');
 return m;
}
export function buildValuation(raw:ValuationInput){
 const v=valuationSchema.parse(raw),missing=valuationMissing(v);
 const rows:ValuationDay[]=[];
 for(let t=Date.UTC(v.year,0,1);t<Date.UTC(v.year+1,0,1);t+=86400000){
  const d=new Date(t),date=d.toISOString().slice(0,10),month=d.getUTCMonth();
  const event=v.events.filter(e=>e.from<=date&&e.to>=date).sort((a,b)=>b.percent-a.percent)[0];
  const override=v.overrides.find(o=>o.date===date);
  const launch=Boolean(v.launchFrom&&v.launchFrom<=date&&date<=v.launchTo);
  const reference=v.monthlyBase[month];
  const calculated=override?.price??(reference!==null&&reference>0?reference*([5,6].includes(d.getUTCDay())?1+v.weekend/100:1)*(event?1+event.percent/100:1)*(launch?1-v.launchDiscount/100:1):null);
  const base=calculated===null?null:round(Math.max(v.minimum??0,Math.min(v.maximum??Infinity,calculated)));
  const prices=Array.from({length:v.maxGuests},(_,i)=>{
   const guests=i+1,target=base===null?null:round(base+Math.max(0,guests-v.baseGuests)*v.extraGuestFee);
   return {guests,channels:v.channels.map(c=>{
    const beforePromotion=target===null||c.commission===null?null:up(target/(1-c.commission/100));
    const list=beforePromotion===null?null:up(beforePromotion/(1-c.promotion/100));
    const payable=list===null?null:round(list*(1-c.promotion/100));
    const cleaning=v.cleaningCharge===null||c.commission===null?null:up(v.cleaningCharge/(1-c.commission/100));
    return {code:c.code,list,payable,cleaning};
   })};
  });
  rows.push({date,month,base,prices,minimumStay:v.minimumStay,limited:calculated!==null&&base!==round(calculated),reason:override?`Correzione: ${override.reason}`:[event?.label,launch?'Lancio':'',[5,6].includes(d.getUTCDay())&&v.weekend?'Weekend':''].filter(Boolean).join(' · ')||'Riferimento mensile'});
 }
 const scenarios=[{code:'PRUDENT',label:'Prudente',delta:-15},{code:'CENTRAL',label:'Centrale',delta:0},{code:'FAVOURABLE',label:'Favorevole',delta:15}].map(s=>({code:s.code,label:s.label,months:Array.from({length:12},(_,month)=>{
  const days=rows.filter(r=>r.month===month),occupancy=Math.max(0,Math.min(100,v.monthlyOccupancy[month]+s.delta)),nights=Math.round(days.length*occupancy/100),stays=nights?Math.ceil(nights/v.averageStay):0;
  const rates=days.map(d=>d.prices.find(p=>p.guests===v.forecastGuests)?.channels.find(c=>c.code===v.forecastChannel));
  const fee=v.channels.find(c=>c.code===v.forecastChannel)!.commission;
  if(rates.some(r=>r?.payable===null||r?.payable===undefined||r?.cleaning===null)||fee===null||v.cleaningCost===null)return {month,occupancy,nights,stays,gross:null,ota:null,cleaning:null,management:null,ownerNet:null,adr:null};
  const avg=rates.reduce((sum,r)=>sum+r!.payable!,0)/days.length,cleanCharge=rates[0]!.cleaning!;
  const gross=round(avg*nights+cleanCharge*stays),ota=round(gross*fee/100),cleaning=round(v.cleaningCost*stays),managementBase=Math.max(0,gross-ota-cleaning);
  const management=round(managementBase*v.management/100*(v.vatMode==='EXCLUDED'?1+v.vat/100:1));
  return {month,occupancy,nights,stays,gross,ota,cleaning,management,ownerNet:round(gross-ota-cleaning-management-v.otherMonthly),adr:round(avg)};
 })}));
 return {engine:VALUATION_ENGINE,missing,rows,scenarios,confidence:'Scenario basato sui riferimenti inseriti dal gestore; nessun dato di mercato acquisito automaticamente.',assumptions:['Prezzi per notte, pulizie separate e tassa di soggiorno esclusa.','Riferimento mensile: prezzo diretto per gli ospiti inclusi, prima di pulizie e gestione.','Prezzi OTA maggiorati per compensare commissioni e promozioni indicate; le promozioni sono ipotizzate sulla sola quota pernottamento.','Il minimo e massimo proteggono il riferimento per gli ospiti inclusi; i supplementi si aggiungono dopo.','Eventi sovrapposti: si applica una sola variazione, quella con percentuale maggiore. Le correzioni manuali sostituiscono gli altri adeguamenti, rispettando minimo e massimo.','Occupazione ipotizzata sull’intero calendario mensile, senza sottrarre automaticamente periodi di uso personale o indisponibilità: inserirne l’effetto nelle ipotesi di occupazione.',
 'Scenari: occupazione centrale inserita per mese, prudente -15 punti e favorevole +15 punti, entro 0-100%. Notti arrotondate; soggiorni stimati arrotondati per eccesso in ogni mese.','Gestione calcolata sul lordo meno OTA e pulizie; altri costi mensili sottratti successivamente. Netto operativo prima delle imposte del proprietario.','Proiezioni indicative, non garanzie di incasso. Disponibilità, condizioni effettive dei portali e domanda devono essere verificate.']};
}
export type ValuationResult=ReturnType<typeof buildValuation>;
