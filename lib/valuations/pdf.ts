import {PDFDocument,StandardFonts,rgb,type PDFPage} from 'pdf-lib';
import type {ValuationSnapshot} from './store';
import {monthNames} from './model';
const safe=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/€/g,'EUR').replace(/[^\x20-\x7E\n]/g,' ');
const amount=(v:number|null)=>v===null?'n.d.':new Intl.NumberFormat('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);
export async function buildValuationPdf(s:ValuationSnapshot,version:number,full=false){
 const pdf=await PDFDocument.create();pdf.setTitle(`Valutazione ${s.input.name} - v${version}`);pdf.setAuthor('Horizon');
 const font=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);
 let page:PDFPage,y=0;const width=595.28,height=841.89,margin=42,usable=width-margin*2;
 const ink=rgb(.08,.13,.17),gold=rgb(.60,.43,.14),muted=rgb(.38,.42,.45);
 const newPage=()=>{page=pdf.addPage([width,height]);y=height-45;page.drawText('HORIZON  |  VALUTAZIONE IMMOBILE',{x:margin,y,size:9,font:bold,color:gold});y-=20;let title=safe(`${s.input.name} - ${s.input.year} - versione ${version}`);while(bold.widthOfTextAtSize(title,10)>usable)title=title.slice(0,-1);page.drawText(title,{x:margin,y,size:10,font:bold,color:ink});y-=22;};
 const wrap=(text:string,size:number,maxWidth=usable)=>{const words=safe(text).split(/\s+/),lines:string[]=[];let line='';for(const word of words){if(font.widthOfTextAtSize((line?line+' ':'')+word,size)>maxWidth&&line){lines.push(line);line='';}if(font.widthOfTextAtSize(word,size)>maxWidth){for(const ch of word){if(font.widthOfTextAtSize(line+ch,size)>maxWidth){lines.push(line);line='';}line+=ch;}}else line+=(line?' ':'')+word;}if(line)lines.push(line);return lines;};
 const text=(value:string,size=9,strong=false)=>{for(const l of wrap(value,size)){if(y<65)newPage();page.drawText(l,{x:margin,y,size,font:strong?bold:font,color:strong?ink:muted});y-=size+4;}y-=5;};
 const heading=(value:string)=>{if(y<110)newPage();y-=8;text(value,12,true);};
 const table=(headers:string[],rows:string[][],widths:number[])=>{const startTable=()=>{if(y<95)newPage();page.drawRectangle({x:margin,y:y-17,width:usable,height:24,color:rgb(.94,.93,.89)});let x=margin+4;headers.forEach((h,i)=>{const maxChars=Math.max(5,Math.floor(widths[i]/4));page.drawText(safe(h).slice(0,maxChars),{x,y:y-8,size:7.2,font:bold,color:ink});x+=widths[i];});y-=30;};startTable();for(const row of rows){if(y<70){newPage();startTable();}let x=margin+4;row.forEach((cell,i)=>{let t=safe(cell);while(font.widthOfTextAtSize(t,7.1)>widths[i]-7&&t.length)t=t.slice(0,-1);page.drawText(t,{x,y,size:7.1,font,color:ink});x+=widths[i];});page.drawLine({start:{x:margin,y:y-6},end:{x:width-margin,y:y-6},color:rgb(.88,.89,.90),thickness:.4});y-=19;}y-=12;};
 newPage();
 text(s.result.missing.length?'BOZZA - DATI DA COMPLETARE':'PROIEZIONE INDICATIVA - RIFERIMENTI INSERITI DAL GESTORE',10,true);
 text(`Valutazione salvata il ${new Date(s.savedAt).toLocaleString('it-IT',{timeZone:'Europe/Rome'})}. Motore ${s.result.engine}.`);
 if(s.input.ownerName)text(`Proposta per: ${s.input.ownerName}`,10,true);
 heading('Immobile e posizionamento');
 text(`${s.input.address||'Indirizzo da completare'}, ${s.input.city} - ${s.input.zone||'zona da precisare'}`);
 text(`Superficie: ${s.input.sqm??'n.d.'} m2 | Camere: ${s.input.bedrooms??'n.d.'} | Bagni: ${s.input.bathrooms??'n.d.'} | Capienza: ${s.input.maxGuests} ospiti | Piano: ${s.input.floor||'n.d.'} | Ascensore: ${{YES:'si',NO:'no',UNKNOWN:'da verificare'}[s.input.elevator]}`);
 for(const [label,value] of [['Dotazioni',s.input.amenities],['Punti di forza',s.input.strengths],['Limiti',s.input.limits],['Clientela',s.input.targetGuest]])if(value)text(`${label}: ${value}`);
 heading('Scenari di risultato annuale');
 text(`Canale simulato: ${s.input.forecastChannel}. Occupazione ospiti: ${s.input.forecastGuests}. Durata media ipotizzata: ${s.input.averageStay} notti. Netto operativo prima delle imposte del proprietario.`);
 table(['Scenario','Notti','Soggiorni','Lordo EUR','Netto EUR'],s.result.scenarios.map(c=>[c.label,String(c.months.reduce((a,m)=>a+m.nights,0)),String(c.months.reduce((a,m)=>a+m.stays,0)),c.months.every(m=>m.gross!==null)?amount(c.months.reduce((a,m)=>a+m.gross!,0)):'n.d.',c.months.every(m=>m.ownerNet!==null)?amount(c.months.reduce((a,m)=>a+m.ownerNet!,0)):'n.d.']),[105,60,75,135,usable-375]);
 if(s.input.targetMonthly!==null)text(`Obiettivo dichiarato: ${amount(s.input.targetMonthly)} EUR netti operativi/mese, non garantiti.`);
 heading('Scenario centrale - riepilogo mensile');
 text('Lordo comprensivo delle pulizie addebitate. Gli altri costi mensili sono gia sottratti nel netto. I mesi non sono rendiconti di prenotazioni reali.');
 table(['Mese','Notti','Lordo','OTA','Pulizie','Gestione','Netto'],s.result.scenarios.find(c=>c.code==='CENTRAL')!.months.map(m=>[monthNames[m.month],String(m.nights),amount(m.gross),amount(m.ota),amount(m.cleaning),amount(m.management),amount(m.ownerNet)]),[75,36,80,75,75,75,usable-416]);
 heading('Condizioni economiche e strategia');
 text(`Pulizia: costo ${amount(s.input.cleaningCost)} EUR, addebito diretto ${amount(s.input.cleaningCharge)} EUR per soggiorno. Altri costi: ${amount(s.input.otherMonthly)} EUR/mese.`);
 text(`Gestione: ${s.input.management}%; IVA ${s.input.vat}% ${s.input.vatMode==='INCLUDED'?'inclusa':s.input.vatMode==='EXCLUDED'?'aggiunta':'non applicata'}. Base: lordo meno OTA e costo pulizie.`);
 text(`Ospiti inclusi: ${s.input.baseGuests}. Extra: ${amount(s.input.extraGuestFee)} EUR/persona/notte sul riferimento diretto. Minimo soggiorno: ${s.input.minimumStay} notti.`);
 text(`Limiti sul riferimento diretto: ${amount(s.input.minimum)} - ${amount(s.input.maximum)} EUR/notte; aumento venerdi/sabato ${s.input.weekend}%.`);
 for(const c of s.input.channels)text(`${c.code}: commissione ${c.commission??'da definire'}%, promozione ipotizzata ${c.promotion}%.`);
 if(s.input.launchFrom)text(`Lancio: ${s.input.launchFrom} - ${s.input.launchTo}, sconto ${s.input.launchDiscount}%.`);
 if(s.input.existingListing){heading('Annunci e recensioni');text(s.input.existingListing);}
 heading('Riferimenti e affidabilita');text(s.result.confidence);text(s.input.source||'Fonti e confronti ancora da inserire.');
 if(s.result.missing.length){heading('Verifiche ancora aperte');for(const m of s.result.missing)text('- '+m);}
 heading('Ipotesi di calcolo');for(const a of s.result.assumptions)text('- '+a,8);
 if(s.input.events.length){heading('Eventi inseriti dal gestore');for(const e of s.input.events)text(`${e.from} - ${e.to}: ${e.label}, ${e.percent}%. Fonte: ${e.source}`,8);}
 if(s.input.photoUrls.length){heading('Riferimenti fotografici');text('Fotografie conservate nella scheda Horizon. Le immagini non sono incorporate in questo PDF.');}
 if(full){
  const guests=Array.from({length:s.input.maxGuests===1?1:s.input.maxGuests-1},(_,i)=>s.input.maxGuests===1?1:i+2);
  for(let start=0;start<guests.length;start+=6){const group=guests.slice(start,start+6);newPage();heading(`Calendario giornaliero - ${s.input.forecastChannel}`);text('Prezzi finali per notte dopo gli sconti ipotizzati, in EUR. Pulizie separate, tassa di soggiorno esclusa. Non sono prezzi applicati sui portali. Il prezzo minimo di soggiorno e '+s.input.minimumStay+' notti.');
   const col=(usable-102)/group.length;
   table(['Notte',...group.map(g=>`${g} ospiti`),'Min.'],s.result.rows.map(r=>[r.date,...group.map(g=>amount(r.prices.find(p=>p.guests===g)?.channels.find(c=>c.code===s.input.forecastChannel)?.payable??null)),String(r.minimumStay)]),[70,...group.map(()=>col),32]);
  }
 }
 const pages=pdf.getPages();pages.forEach((p,i)=>p.drawText(`Horizon | v${version} | Stima indicativa, nessuna garanzia di incasso | ${i+1}/${pages.length}`,{x:margin,y:29,size:7,font,color:muted}));
 return pdf.save();
}
