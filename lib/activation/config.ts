import { z } from "zod";
import { parseDay } from "./dates";

export const channels = ["BOOKING", "AIRBNB", "VRBO", "DIRECT"] as const;
export const channelLabels = { BOOKING: "Booking.com", AIRBNB: "Airbnb", VRBO: "Vrbo", DIRECT: "Diretto" };
export const checklist = {
  documents: "Documentazione e requisiti verificati",
  access: "Accessi, chiavi e istruzioni provati",
  operations: "Pulizie, biancheria e referenti pronti",
  calendar: "Calendari e blocchi verificati",
  photos: "Fotografie e dotazioni controllate",
  content: "Contenuti e condizioni degli annunci verificati",
  economics: "Costi, commissioni e basi di calcolo confermati",
} as const;
const amount = z.number().finite().min(0).max(1000000);
const rate = z.number().finite().min(0).max(99);
const day = z.string().refine((value) => { try { parseDay(value); return true; } catch { return false; } }, "Data non valida");
const optionalDay = z.union([z.literal(""), day]);
const link = z.string().max(2000).refine((value) => { if (!value) return true; try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; } }, "Link non valido");
export const activationSchema = z.object({
  mode: z.enum(["NEW", "ESTABLISHED", "RELAUNCH"]), targetGuest: z.string().max(1000), strengths: z.string().max(2000), limits: z.string().max(2000),
  base: amount.nullable(), floor: amount.nullable(), ceiling: amount.nullable(), targetMonthly: amount.nullable(),
  baseGuests: z.number().int().min(1).max(50), extraGuestFee: amount,
  cleaning: amount, otherCosts: amount, management: rate, vat: rate, vatMode: z.enum(["NONE", "INCLUDED", "EXCLUDED"]),
  minimumStay: z.number().int().min(1).max(365), calendarComplete: z.boolean(),
  launchStart: optionalDay, launchEnd: optionalDay, launchDiscount: rate, exitCriteria: z.string().max(2000),
  cancellation: z.string().max(2000), notes: z.string().max(4000),
  checks: z.object({ documents: z.boolean(), access: z.boolean(), operations: z.boolean(), calendar: z.boolean(), photos: z.boolean(), content: z.boolean(), economics: z.boolean() }),
  tasks: z.array(z.object({ id: z.string().min(1).max(80), title: z.string().min(1).max(300), owner: z.string().max(150), due: optionalDay, done: z.boolean() })).max(100),
  channels: z.array(z.object({ code: z.enum(channels), enabled: z.boolean(), commission: rate.nullable(), promotion: rate, promotionsVerified: z.boolean(),
    title: z.string().max(300), descriptionIt: z.string().max(10000), descriptionEn: z.string().max(10000), url: link, published: z.boolean() })).length(4),
  reviews: z.array(z.object({ day: z.union([z.literal(3), z.literal(7), z.literal(14), z.literal(30)]), done: z.boolean(), note: z.string().max(3000) })).length(4),
}).superRefine((value, ctx) => {
  const fail = (message: string) => ctx.addIssue({ code: "custom", message });
  if (new Set(value.channels.map((channel) => channel.code)).size !== 4) fail("I canali devono essere univoci.");
  if (new Set(value.reviews.map((review) => review.day)).size !== 4) fail("Le verifiche devono essere univoche.");
  if (new Set(value.tasks.map((task) => task.id)).size !== value.tasks.length) fail("Attività duplicate.");
  if (value.base !== null && value.base <= 0) fail("Il riferimento deve essere maggiore di zero.");
  if (value.floor !== null && value.floor <= 0) fail("La soglia deve essere maggiore di zero.");
  if (value.ceiling !== null && (value.ceiling <= 0 || value.ceiling < (value.floor ?? 0))) fail("Massimo inferiore alla soglia minima.");
  if (Boolean(value.launchStart) !== Boolean(value.launchEnd) || (value.launchStart && value.launchEnd < value.launchStart)) fail("Indica un periodo di lancio completo e ordinato.");
  if (value.launchDiscount > 0 && !value.launchStart) fail("Lo sconto di lancio richiede un periodo.");
  if (value.launchStart && !value.exitCriteria.trim()) fail("Definisci i criteri di uscita dal lancio.");
  if (value.management * (value.vatMode === "EXCLUDED" ? 1 + value.vat / 100 : 1) >= 100) fail("La gestione con IVA deve essere inferiore al 100%.");
});
export type ActivationConfig = z.infer<typeof activationSchema>;
export function initialConfig(input: { base: number | null; baseGuests: number; extraGuestFee: number; cleaning: number; management: number; vat: number; vatMode: ActivationConfig["vatMode"]; minimumStay: number; commissions: { channel: string; percent: number }[] }): ActivationConfig {
  return { mode: "NEW", targetGuest: "", strengths: "", limits: "", base: input.base, floor: null, ceiling: null, targetMonthly: null,
    baseGuests: input.baseGuests, extraGuestFee: input.extraGuestFee, cleaning: input.cleaning, otherCosts: 0, management: input.management, vat: input.vat, vatMode: input.vatMode,
    minimumStay: input.minimumStay, calendarComplete: false, launchStart: "", launchEnd: "", launchDiscount: 0, exitCriteria: "", cancellation: "", notes: "",
    checks: { documents: false, access: false, operations: false, calendar: false, photos: false, content: false, economics: false },
    tasks: [{ id: "launch-rates", title: "Approvare tariffe e promozioni di lancio", owner: "", due: "", done: false }, { id: "availability", title: "Verificare disponibilità sui portali", owner: "", due: "", done: false }],
    channels: channels.map((code) => ({ code, enabled: code === "BOOKING" || code === "AIRBNB", commission: input.commissions.find((item) => item.channel === code)?.percent ?? (code === "DIRECT" ? 0 : null), promotion: 0, promotionsVerified: false, title: "", descriptionIt: "", descriptionEn: "", url: "", published: false })),
    reviews: ([3, 7, 14, 30] as const).map((day) => ({ day, done: false, note: "" })),
  };
}
export function readiness(config: ActivationConfig) {
  const missing: string[] = Object.entries(checklist).filter(([key]) => !config.checks[key as keyof typeof checklist]).map(([, label]) => label);
  if (!config.base || !config.floor) missing.push("Impostare riferimento e soglia minima");
  if (!config.channels.some((channel) => channel.enabled)) missing.push("Scegliere almeno un canale");
  for (const channel of config.channels.filter((item) => item.enabled)) {
    if (channel.commission === null || !channel.promotionsVerified || !channel.title.trim() || !channel.descriptionIt.trim() || !channel.descriptionEn.trim()) missing.push(`Completare configurazione ${channelLabels[channel.code]}`);
  }
  if (!config.launchStart || !config.exitCriteria.trim()) missing.push("Definire periodo e criteri della strategia");
  if (!config.cancellation.trim()) missing.push("Definire condizioni di cancellazione");
  if (config.tasks.some((task) => !task.done)) missing.push("Completare le attività aperte");
  return missing;
}
