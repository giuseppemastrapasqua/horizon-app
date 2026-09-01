import { describe, expect, it } from "vitest";

import { toAlloggiatiGuestTypeCode } from "./guest-role-code";

describe("toAlloggiatiGuestTypeCode", () => {
  it.each([
    ["SINGLE_GUEST", "16"],
    ["FAMILY_HEAD", "17"],
    ["GROUP_HEAD", "18"],
    ["FAMILY_MEMBER", "19"],
    ["GROUP_MEMBER", "20"],
  ] as const)("maps %s to %s", (role, expected) => {
    expect(toAlloggiatiGuestTypeCode(role)).toBe(expected);
  });
});
