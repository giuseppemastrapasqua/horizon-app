import { describe, expect, it } from "vitest";

import {
  createOperatorInviteToken,
  hashOperatorInviteToken,
  isOperatorInviteUsable,
  OPERATOR_INVITE_VALIDITY_HOURS,
} from "./property-operator-invite-token";

describe("property operator invite token", () => {
  it("creates a random token and stores a different SHA-256 hash", () => {
    const first = createOperatorInviteToken();
    const second = createOperatorInviteToken();

    expect(first.token).not.toBe(first.tokenHash);
    expect(first.tokenHash).toBe(hashOperatorInviteToken(first.token));
    expect(first.token).not.toBe(second.token);
  });

  it("expires after the configured validity window", () => {
    const now = new Date("2026-09-10T06:00:00.000Z");
    const invite = createOperatorInviteToken(now);

    expect(invite.expiresAt.getTime()).toBe(
      now.getTime() + OPERATOR_INVITE_VALIDITY_HOURS * 60 * 60 * 1000,
    );
  });

  it("accepts only pending and non-expired invites", () => {
    const now = new Date("2026-09-10T06:00:00.000Z");

    expect(
      isOperatorInviteUsable(
        {
          expiresAt: new Date("2026-09-11T06:00:00.000Z"),
          acceptedAt: null,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(true);

    expect(
      isOperatorInviteUsable(
        {
          expiresAt: new Date("2026-09-10T05:59:59.000Z"),
          acceptedAt: null,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isOperatorInviteUsable(
        {
          expiresAt: new Date("2026-09-11T06:00:00.000Z"),
          acceptedAt: now,
          revokedAt: null,
        },
        now,
      ),
    ).toBe(false);

    expect(
      isOperatorInviteUsable(
        {
          expiresAt: new Date("2026-09-11T06:00:00.000Z"),
          acceptedAt: null,
          revokedAt: now,
        },
        now,
      ),
    ).toBe(false);
  });
});