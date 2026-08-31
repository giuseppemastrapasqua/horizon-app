import { describe, expect, it } from "vitest";

import {
  createOwnerInviteToken,
  hashOwnerInviteToken,
  isOwnerInviteUsable,
  OWNER_INVITE_VALIDITY_HOURS,
} from "./property-owner-invite-token";

describe("property owner invite token", () => {
  it("creates a random token and stores a different SHA-256 hash", () => {
    const first = createOwnerInviteToken();
    const second = createOwnerInviteToken();

    expect(first.token).not.toBe(first.tokenHash);
    expect(first.tokenHash).toBe(hashOwnerInviteToken(first.token));
    expect(first.token).not.toBe(second.token);
  });

  it("expires after the configured validity window", () => {
    const now = new Date("2026-08-31T20:00:00.000Z");
    const invite = createOwnerInviteToken(now);

    expect(invite.expiresAt.getTime()).toBe(
      now.getTime() + OWNER_INVITE_VALIDITY_HOURS * 60 * 60 * 1000,
    );
  });

  it("accepts only pending and non-expired invites", () => {
    const now = new Date("2026-08-31T20:00:00.000Z");

    expect(
      isOwnerInviteUsable(
        {
          expiresAt: new Date("2026-09-01T20:00:00.000Z"),
          acceptedAt: null,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(true);

    expect(
      isOwnerInviteUsable(
        {
          expiresAt: new Date("2026-08-31T19:59:59.000Z"),
          acceptedAt: null,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isOwnerInviteUsable(
        {
          expiresAt: new Date("2026-09-01T20:00:00.000Z"),
          acceptedAt: now,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isOwnerInviteUsable(
        {
          expiresAt: new Date("2026-09-01T20:00:00.000Z"),
          acceptedAt: null,
          revokedAt: now,
        },
        now,
      ),
    ).toBe(false);
  });
});