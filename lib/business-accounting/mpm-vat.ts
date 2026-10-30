import type { ForecastMonth } from "@/lib/finance/admin-monthly-forecast";
/** Company management view only: property contracts and owner payouts are unchanged. */
export function companyMpmAmounts(row: Pick<ForecastMonth,"management"|"managementVat">) {
 const gross=Math.round((row.management+row.managementVat)*100);
 const net=Math.round(gross/1.22);
 return {gross,vat:gross-net,net};
}
