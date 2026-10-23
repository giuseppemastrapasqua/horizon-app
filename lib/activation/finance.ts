import { calculateFinanceFormula } from "@/lib/finance/formula/calculate-finance-formula";
import type { FinanceRule } from "@/lib/finance/formula/types";
import type { ActivationConfig } from "./config";

export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
// Explicit projection, using the shared formula evaluator. No implicit personal tax.
// Management base: revenue after OTA and cleaning; other costs deducted afterwards.
export function projectStay(config: ActivationConfig, gross: number, commission: number) {
  const rule = (id: string, name: string, order: number, category: FinanceRule["category"], value: number, base: FinanceRule["base"], valueType: FinanceRule["valueType"], baseRuleId?: string): FinanceRule => ({ id, name, order, category, value, base, valueType, baseRuleId, isEnabled: true, operation: "SUBTRACT" });
  const effectiveManagement = config.management * (config.vatMode === "EXCLUDED" ? 1 + config.vat / 100 : 1);
  const rules = [
    rule("ota", "Commissioni e costi canale", 0, "OTA_COMMISSION", commission, "GROSS_REVENUE", "PERCENTAGE"),
    rule("cleaning", "Pulizie per soggiorno", 1, "CLEANING", config.cleaning, "CURRENT_TOTAL", "FIXED"),
    rule("management", "Gestione, IVA compresa se prevista", 2, "MANAGEMENT_COMMISSION", effectiveManagement, "CURRENT_TOTAL", "PERCENTAGE"),
    rule("other", "Altri costi per soggiorno", 3, "OTHER", config.otherCosts, "CURRENT_TOTAL", "FIXED"),
  ];
  const result = calculateFinanceFormula({ formula: { id: "activation-projection-v1", name: "Proiezione attivazione", currency: "EUR", rules }, context: { grossRevenue: gross, bookingCount: 1, cleaningCost: config.cleaning } });
  return { net: money(result.finalAmount), rows: result.rules.map((item) => ({ label: item.ruleName, amount: money(item.calculatedAmount) })) };
}
