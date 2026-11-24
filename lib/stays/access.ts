import { createHash, timingSafeEqual } from "node:crypto";

// Dedicated read-only service credential. Never accept a browser session here.
export function hasStaysAccess(request: Request): boolean {
  const secret = process.env.STAYS_SERVICE_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 32 || !authorization.startsWith("Bearer ")) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(authorization.slice(7)), digest(secret));
}

export function staysPropertyIds(): string[] {
  return (process.env.STAYS_PROPERTY_IDS ?? "").split(",").map(id => id.trim()).filter(Boolean);
}

export function parseStayQuery(url: URL) {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const guests = Number(url.searchParams.get("guests") ?? 1);
  if (!Number.isInteger(guests) || guests < 1 || guests > 20) throw new Error("Numero ospiti non valido.");
  if (!from && !to) return { guests, from: null, to: null };
  const day = (value: string | null) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Date non valide.");
    const date = new Date(value + "T00:00:00.000Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Date non valide.");
    return date;
  };
  const start = day(from), end = day(to);
  const nights = (end.getTime() - start.getTime()) / 86400000;
  if (nights < 1 || nights > 60) throw new Error("Scegli un soggiorno da 1 a 60 notti.");
  return { guests, from: start, to: end };
}

export function safePhotoUrl(value: string): string | null {
  // Historic local uploads are not present on the current Vercel deployment.
  // Do not publish dead images or arbitrary private/external URLs.
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "anyzciwyxkfrheavqjpf.supabase.co" &&
      url.pathname.startsWith("/storage/v1/object/public/property-images/") ? url.href : null;
  } catch { return null; }
}
