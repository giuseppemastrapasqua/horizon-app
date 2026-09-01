import type { BookingGuestRole } from "@prisma/client";

export type AlloggiatiGuestTypeCode =
  | "16"
  | "17"
  | "18"
  | "19"
  | "20";

const ROLE_CODES = {
  SINGLE_GUEST: "16",
  FAMILY_HEAD: "17",
  GROUP_HEAD: "18",
  FAMILY_MEMBER: "19",
  GROUP_MEMBER: "20",
} satisfies Record<BookingGuestRole, AlloggiatiGuestTypeCode>;

export function toAlloggiatiGuestTypeCode(
  role: BookingGuestRole,
): AlloggiatiGuestTypeCode {
  return ROLE_CODES[role];
}
