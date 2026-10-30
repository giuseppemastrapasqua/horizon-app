export function splitFourInstallments(totalCents: number | null): (number | null)[] {
 if(totalCents===null)return [null,null,null,null];
 if(!Number.isSafeInteger(totalCents)||totalCents<0)throw new Error("Importo INPS non valido");
 const quarter=Math.floor(totalCents/4);
 return [quarter,quarter,quarter,totalCents-quarter*3];
}
