import { z } from "zod";

const cents = z.number().int().min(0).max(100_000_000_00);
const date = z.iso.date();
export const movementKinds = {
  INCOME: "Compenso attività", EXPENSE: "Spesa attività", CONTRIBUTION: "Versamento INPS",
  TAX: "Versamento imposta", THIRD_IN: "Entrata per conto terzi", THIRD_OUT: "Uscita per conto terzi",
  PERSONAL_IN: "Apporto personale", PERSONAL_OUT: "Prelievo personale",
} as const;
export const movementSchema = z.object({
  id: z.string().uuid(), date, description: z.string().trim().min(1).max(200),
  kind: z.enum(Object.keys(movementKinds) as [keyof typeof movementKinds, ...(keyof typeof movementKinds)[]]),
  category: z.string().trim().min(1).max(80), reference: z.string().trim().max(150),
  amount: cents.refine((n) => n > 0, "Inserisci un importo positivo."),
  paid: z.boolean(), archived: z.boolean(),
  taxYear: z.number().int().min(2020).max(2100),
  deductible: z.boolean(),
});
export const accountingSchema = z.object({
  ateco: z.literal("55.20.42"), taxRate: z.literal(15), coefficient: z.number().min(1).max(100),
  fiscalConfirmed: z.boolean(), openingBalance: z.number().int().min(-100_000_000_00).max(100_000_000_00),
  openingThirdParty: cents, contributionEstimate: cents.nullable(),
  movements: z.array(movementSchema).max(1000),
}).superRefine((value, ctx) => {
  if (new Set(value.movements.map((m) => m.id)).size !== value.movements.length)
    ctx.addIssue({ code: "custom", message: "Movimenti duplicati.", path: ["movements"] });
});
export type Accounting = z.infer<typeof accountingSchema>;
export type Movement = z.infer<typeof movementSchema>;
export const initialAccounting: Accounting = {
  ateco: "55.20.42", taxRate: 15, coefficient: 40, fiscalConfirmed: false,
  openingBalance: 0, openingThirdParty: 0, contributionEstimate: null, movements: [],
};
export const euro = (cents: number | null) => cents === null ? "Da configurare" :
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(cents / 100);
