import { type FinanceRule } from "@/lib/finance";

export const initialFormulaRules: FinanceRule[] = [
  {
    id: "ota-booking",
    name: "Commissione OTA Booking",
    description:
      "Commissione applicata da Booking.com.",
    order: 1,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "PERCENTAGE",
    value: 25,
    base: "GROSS_REVENUE",
  },
  {
    id: "cleaning",
    name: "Pulizie",
    description:
      "Costo pulizie configurato per l’alloggio.",
    order: 2,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "FIXED",
    value: 100,
    base: "CURRENT_TOTAL",
  },
  {
    id: "property-manager",
    name: "Commissione Property Manager",
    description:
      "Commissione calcolata sul totale dopo OTA e pulizie.",
    order: 3,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "PERCENTAGE",
    value: 20,
    base: "CURRENT_TOTAL",
  },
  {
    id: "cedolare",
    name: "Cedolare secca",
    description:
      "Aliquota fiscale applicata al prezzo lordo.",
    order: 4,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "PERCENTAGE",
    value: 21,
    base: "GROSS_REVENUE",
  },
  {
    id: "extra",
    name: "Extra",
    description:
      "Altri costi della prenotazione.",
    order: 5,
    isEnabled: true,
    operation: "SUBTRACT",
    valueType: "FIXED",
    value: 0,
    base: "CURRENT_TOTAL",
  },
];