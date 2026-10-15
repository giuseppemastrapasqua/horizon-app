import {
  isGuestCheckInLanguage,
  type GuestCheckInLanguage,
} from "@/app/check-in/[token]/translations";

export function resolveGuestLanguage(
  stored: string | null,
  browserLanguage: string,
): GuestCheckInLanguage {
  if (stored && isGuestCheckInLanguage(stored)) return stored;
  const detected = browserLanguage.toLowerCase().split("-")[0];
  return isGuestCheckInLanguage(detected) ? detected : "it";
}
