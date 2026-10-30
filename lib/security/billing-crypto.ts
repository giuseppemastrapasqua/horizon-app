import { encryptCredential, decryptCredential } from "./credential-crypto";
const prefix = "billing:";
const fields = ["firstName", "lastName", "businessName", "taxCode", "vatNumber", "address", "postalCode", "city", "province", "country", "email", "pec", "recipientCode"];
function key() {
  const value = process.env.HORIZON_BILLING_ENCRYPTION_KEY;
  if (!value) throw new Error("Cifratura dati fiscali non configurata.");
  return value;
}
export function protectBilling<T extends object>(profile: T): T {
  const result = { ...profile } as Record<string, unknown>;
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value) result[field] = prefix + encryptCredential(value, key());
  }
  return result as T;
}
// Call only on the server after authorization, never in logging or audit metadata.
export function revealBilling<T extends object>(profile: T): T {
  const result = { ...profile } as Record<string, unknown>;
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.startsWith(prefix)) result[field] = decryptCredential(value.slice(prefix.length), key());
  }
  return result as T;
}
export function revealInvoice(value: unknown): unknown {
  if (!value || typeof value !== "object" || !("recipient" in value) || !value.recipient || typeof value.recipient !== "object") return value;
  return { ...value, recipient: revealBilling(value.recipient) };
}
