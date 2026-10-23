import { describe, expect, it } from "vitest";
import { calculateAccounting } from "./calculate";
import { accountingSchema, initialAccounting, type Accounting, type Movement } from "./config";

let sequence = 0;
function movement(kind: Movement["kind"], amount: number, patch: Partial<Movement> = {}): Movement {
  return { id: `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`, date: "2026-10-23", kind, amount,
    description: "Prova", category: "Test", reference: "", paid: true, archived: false, taxYear: 2026, deductible: false, ...patch };
}
const data = (movements: Movement[], patch: Partial<Accounting> = {}): Accounting => ({ ...initialAccounting, fiscalConfirmed: true, contributionEstimate: 1_000_00, movements, ...patch });

describe("contabilità forfettaria", () => {
  it("separates real costs from the taxable coefficient and deducts only paid mandatory contributions", () => {
    const result = calculateAccounting(data([movement("INCOME", 10_000_00), movement("EXPENSE", 3_000_00), movement("CONTRIBUTION", 500_00, { deductible: true }), movement("CONTRIBUTION", 200_00), movement("CONTRIBUTION", 100_00, { paid: false, deductible: true })]), 2026);
    expect(result.fiscalGross).toBe(4_000_00);
    expect(result.taxable).toBe(3_500_00);
    expect(result.taxEstimate).toBe(525_00);
    expect(result.net).toBe(5_475_00);
    expect(result.contributionsPaid).toBe(700_00);
    expect(result.reserveContribution).toBe(300_00);
  });
  it("does not count owner funds, pending, archived or other-year income as own revenue", () => {
    const result = calculateAccounting(data([movement("INCOME", 100_00), movement("THIRD_IN", 2_000_00), movement("THIRD_OUT", 1_000_00), movement("INCOME", 800_00, { paid: false }), movement("INCOME", 300_00, { archived: true }), movement("INCOME", 200_00, { date: "2025-01-01" })]), 2026);
    expect(result.income).toBe(100_00);
    expect(result.receivables).toBe(800_00);
    expect(result.balance).toBe(1_100_00);
    expect(result.thirdParty).toBe(1_000_00);
  });
  it("does not deduct prior-year tax payments twice or use them as current-year advances", () => {
    const result = calculateAccounting(data([movement("INCOME", 10_000_00), movement("TAX", 300_00, { taxYear: 2025 }), movement("TAX", 100_00), movement("CONTRIBUTION", 400_00, { taxYear: 2025, deductible: true })]), 2026);
    expect(result.taxEstimate).toBe(540_00);
    expect(result.reserveTax).toBe(440_00);
    expect(result.reserveContribution).toBe(1_000_00);
    expect(result.net).toBe(8_460_00);
    expect(result.balance).toBe(9_200_00);
    expect(result.available).toBe(7_760_00);
  });
  it("requires fiscal confirmation and an explicit INPS estimate", () => {
    const result = calculateAccounting({ ...initialAccounting, movements: [movement("INCOME", 1_000_00)] }, 2026);
    expect(result.taxEstimate).toBeNull(); expect(result.net).toBeNull(); expect(result.available).toBeNull();
  });
  it("caps taxable income at zero and never treats excess payments as negative reserves", () => {
    const result = calculateAccounting(data([movement("INCOME", 100_00), movement("CONTRIBUTION", 1_500_00, { deductible: true }), movement("TAX", 100_00)]), 2026);
    expect(result.taxable).toBe(0); expect(result.reserve).toBe(0); expect(result.net).toBe(-900_00);
  });
  it("suspends the flat-rate tax calculation above 100k but not at the boundary", () => {
    expect(calculateAccounting(data([movement("INCOME", 100_000_00)]), 2026).taxEstimate).not.toBeNull();
    expect(calculateAccounting(data([movement("INCOME", 100_000_01)]), 2026).net).toBeNull();
  });
  it("rejects invalid dates, negative amounts and duplicate IDs", () => {
    expect(accountingSchema.safeParse(data([movement("INCOME", -10)])).success).toBe(false);
    expect(accountingSchema.safeParse(data([movement("INCOME", 100, { date: "2026-02-31" })])).success).toBe(false);
    const m = movement("INCOME", 100);
    expect(accountingSchema.safeParse(data([m, m])).success).toBe(false);
  });
});
