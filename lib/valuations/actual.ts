import type {ControlStay} from '@/lib/revenue/control/analyze';
import {buildRevenueHistory} from '@/lib/revenue/control/history';
import type {ValuationInput} from './model';
import type {ValuationResult} from './engine';
import {romeDay} from './evidence';
/** Operational comparison by physical night, independent of owner accounting periods. */
export function compareValuationActual(v:ValuationInput,result:ValuationResult,savedAt:string,stays:ControlStay[],now=new Date()){
 const today=romeDay(now),stop=new Date(today+'T00:00:00Z').getTime();
 const central=result.scenarios.find(s=>s.code==='CENTRAL')!;
 return Array.from({length:12},(_,month)=>{
  const from=Date.UTC(v.year,month,1),to=Date.UTC(v.year,month+1,1),end=Math.min(to,stop);
  const elapsed=Math.max(0,(end-from)/86400000),days=(to-from)/86400000;
  const monthKey=`${v.year}-${String(month+1).padStart(2,'0')}`;
  const endKey=new Date(end).toISOString().slice(0,10);
  const actual=(elapsed?buildRevenueHistory(stays,endKey).find(h=>h.month===monthKey):undefined)??{occupied:0,missing:0,overlaps:0,invalidNights:0,grossCents:0};
  const beforeMonth=romeDay(new Date(savedAt))<monthKey+'-01';
  const valid=elapsed>0&&actual.occupied>0&&actual.missing===0&&actual.overlaps===0&&actual.invalidNights===0;
  const projected=central.months[month].gross;
  const forecast=projected===null||!elapsed?null:Math.round(projected*elapsed/days*100)/100;
  const gross=valid?actual.grossCents/100:null;
  return {month,elapsed,days,nights:elapsed?actual.occupied:0,missing:elapsed?actual.missing:0,overlaps:elapsed?actual.overlaps:0,invalid:elapsed?actual.invalidNights:0,gross,forecast,delta:beforeMonth&&gross!==null&&forecast!==null?Math.round((gross-forecast)*100)/100:null,kind:beforeMonth?'PREVISIONE':'RETROSPETTIVO',partial:elapsed<days};
 });
}
