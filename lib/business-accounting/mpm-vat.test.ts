import { expect,it } from "vitest";
import { companyMpmAmounts } from "./mpm-vat";
it("extracts company VAT from all gross MPM compensation even when contract VAT is zero",()=>{expect(companyMpmAmounts({management:6000,managementVat:0})).toEqual({gross:600000,net:491803,vat:108197});});
it("does not add contract VAT a second time and preserves cents",()=>{const r=companyMpmAmounts({management:100,managementVat:22});expect(r).toEqual({gross:12200,net:10000,vat:2200});expect(r.net+r.vat).toBe(r.gross);});
