import { expect,it } from "vitest";
import { buildAdminMonthlyForecast,type ForecastBooking } from "./admin-monthly-forecast";
const b:ForecastBooking={propertyId:"p",propertyName:"Synthetic",currency:"EUR",bookingStatus:"CONFIRMED",checkOut:new Date("2026-11-02Z"),accountingMonth:null,gross:1000,cleaning:50,pm:20,vat:22,vatMode:"INCLUDED",f24:21,ota:19.5};
it("shows November immediately, with included VAT separated from commission and no double subtraction",()=>{
 const r=buildAdminMonthlyForecast([b],2026)[10];expect(r.gross).toBe(1000);expect(r.ota).toBe(195);expect(r.management).toBe(123.77);expect(r.managementVat).toBe(27.23);expect(r.ownerNet).toBe(477.16);expect(r.companyMargin).toBe(73.77);expect(r.reports).toBe(0);
});
it("moves an override into October and excludes cancelled stays",()=>{
 const rows=buildAdminMonthlyForecast([{...b,accountingMonth:new Date("2026-10-01Z")},{...b,bookingStatus:"CANCELLED"}],2026);expect(rows[9].gross).toBe(1000);expect(rows[10].gross).toBe(0);
});
it("preserves real zero F24 and flags missing OTA or management instead of inventing net",()=>{
 const r=buildAdminMonthlyForecast([{...b,f24:0,vatMode:"NONE"},{...b,propertyName:"Missing",ota:null}],2026)[10];expect(r.ownerNet).toBe(604);expect(r.missing).toEqual(["Missing"]);expect(r.gross).toBe(2000);
});
it("does not silently convert foreign currency",()=>{const r=buildAdminMonthlyForecast([{...b,currency:"USD"}],2026)[10];expect(r.gross).toBe(0);expect(r.missing).toEqual(["Synthetic"]);});
