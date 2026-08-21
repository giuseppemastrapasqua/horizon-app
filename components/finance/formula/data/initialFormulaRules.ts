import { type FinanceRule } from "@/lib/finance";

export const initialFormulaRules: FinanceRule[] = [
  {
    id: "cedolare",
    name: "Cedolare secca",
    description:
      "Aliquota fiscale applicata al lordo della prenotazione.",
    order: 1,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "PERCENTAGE",
    value: 21,
    base: "GROSS_REVENUE",
    category: "TAX",
  },
  {
    id: "extra",
    name: "Varie",
    description:
      "Eventuali costi o rettifiche aggiuntive del rendiconto.",
    order: 2,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "FIXED",
    value: 0,
    base: "CURRENT_TOTAL",
    category: "OTHER",
  },
];
