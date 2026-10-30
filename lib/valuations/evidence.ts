import type {ValuationInput} from './model';
const day=86400000;
const up=(n:number)=>Math.ceil((n-1e-9)*100)/100;
export const romeDay=(now:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
/** Evidence describes coverage, never a probability that a price will sell. */
export function analyzeValuationEvidence(v:ValuationInput,today:string){
 const t=Date.parse(today+'T00:00:00Z');
 const observations=(v.comparables??[]).map(c=>{
  const age=Math.round((t-Date.parse(c.observedOn+'T00:00:00Z'))/day);
  const nights=(Date.parse(c.to)-Date.parse(c.from))/day;
  const reasons=[...(c.sqm===null||c.maxGuests===null||c.bedrooms===null?['Caratteristiche incomplete']:[]),...(!c.comparable?['Comparabilità non confermata']:[]),...(age<0?['Rilevazione futura']:age>30?['Rilevazione oltre 30 giorni']:[]),...(c.guests!==v.forecastGuests?['Numero ospiti diverso dallo scenario']:[]),...(c.cleaning===null?['Pulizie non separate nel totale']:[]),...(!c.from.startsWith(String(v.year))||!c.to.startsWith(String(v.year))?['Periodo fuori dall’anno valutato']:[])];
  return {...c,nights,age,nightly:c.cleaning===null?null:Math.round((c.total-c.cleaning)/nights*100)/100,usable:reasons.length===0,reasons};
 });
 const usable=observations.filter(o=>o.usable);
 const months=Array.from({length:12},(_,month)=>{
  const selected=usable.filter(o=>{const start=Date.UTC(v.year,month,1),end=Date.UTC(v.year,month+1,1);return Date.parse(o.from)<end&&Date.parse(o.to)>start;});
  const asking=selected.filter(o=>o.kind==='ASKING'),booked=selected.filter(o=>o.kind==='BOOKED');
  const properties=new Set(selected.map(o=>o.url.split('?')[0].replace(/\/$/,''))).size;
  return {month,observations:selected.length,properties,asking:asking.length,booked:booked.length};
 });
 const gaps=[...(observations.length?[]:['Nessun confronto strutturato inserito.']),...(observations.some(o=>!o.usable)?['Alcuni confronti sono esclusi: controllare date, ospiti, pulizie e comparabilità.']:[]),...(months.some(m=>m.properties<3)?['Meno di tre immobili distinti comparabili in almeno un mese.']:[]),...(!v.sourcesVerified?['Riferimenti non confermati dal gestore.']:[])];
 return {asOf:today,observations,months,gaps,label:gaps.length?'Copertura da completare':'Copertura documentata da verificare',note:'Il prezzo pubblicizzato non prova una vendita. I prezzi osservati restano lordi del canale, senza pulizie: non sono confrontabili direttamente con il riferimento diretto. La soglia di 30 giorni e tre immobili è un controllo operativo, non una certificazione di mercato.'};
}
/** Public nightly floor after discounts. Cleaning is charged once per stay. */
export function economicFloors(v:ValuationInput){
 const c=v.channels.find(c=>c.code===v.forecastChannel)!;
 const management=v.management/100*(v.vatMode==='EXCLUDED'?1+v.vat/100:1);
 return Array.from({length:12},(_,month)=>{
  const days=new Date(Date.UTC(v.year,month+1,0)).getUTCDate();
  const nights=Math.round(days*v.monthlyOccupancy[month]/100);
  const costsPerNight=nights>0?v.otherMonthly/nights:null;
  const targetPerNight=nights>0&&v.targetMonthly!==null?v.targetMonthly/nights:null;
  return {month,nights,stays:[...new Set([v.minimumStay,Math.max(2,v.minimumStay),Math.max(3,v.minimumStay),Math.max(7,v.minimumStay)])].map(length=>{
   if(c.commission===null||v.cleaningCost===null||v.cleaningCharge===null||costsPerNight===null)return {length,breakEven:null,target:null};
   const cleaningCost=v.cleaningCost;
   const fee=c.commission/100,cleanCharge=up(v.cleaningCharge/(1-fee));
   const price=(goal:number)=>up(Math.max(0,((goal+costsPerNight)/(1-management)+cleaningCost/length)/(1-fee)-cleanCharge/length));
   return {length,breakEven:price(0),target:targetPerNight===null?null:price(targetPerNight)};
  })};
 });
}
