import { expect,it } from "vitest";
import { splitFourInstallments } from "./inps-plan";
it("preserves all cents across exactly four installments",()=>{const parts=splitFourInstallments(10001);expect(parts).toEqual([2500,2500,2500,2501]);expect(parts.reduce<number>((n,v)=>n+(v??0),0)).toBe(10001);});
it("keeps an unknown estimate unknown",()=>{expect(splitFourInstallments(null)).toEqual([null,null,null,null]);expect(splitFourInstallments(0)).toEqual([0,0,0,0]);expect(()=>splitFourInstallments(-1)).toThrow();});
