import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcryptjs", () => ({
  hash: vi.fn(async () => "bcrypt-hash"),
}));

vi.mock("@/lib/auth/password-reset-token", () => ({
  createPasswordResetToken: vi.fn(() => ({
    token: "public-reset-token",
    tokenHash: "reset-token-hash",
    expiresAt: new Date("2026-09-06T12:30:00.000Z"),
  })),
  hashPasswordResetToken: vi.fn(() => "reset-token-hash"),
  isPasswordResetTokenUsable: vi.fn(
    (resetToken) =>
      resetToken.usedAt === null &&
      resetToken.expiresAt.getTime() > Date.now(),
  ),
}));

vi.mock("@/lib/notifications/email/send-email", () => ({
  sendEmail: vi.fn(async () => ({})),
}));

const tx = {
  passwordResetToken: {
    updateMany: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(
      async (callback) => callback(tx),
    ),
  },
}));

import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "./password-reset-actions";

const userFindUnique = vi.mocked(prisma.user.findUnique);
const tokenFindFirst = vi.mocked(
  prisma.passwordResetToken.findFirst,
);
const tokenFindUnique = vi.mocked(
  prisma.passwordResetToken.findUnique,
);
const tokenCreate = vi.mocked(
  prisma.passwordResetToken.create,
);
const tokenDeleteMany = vi.mocked(
  prisma.passwordResetToken.deleteMany,
);
const mockedSendEmail = vi.mocked(sendEmail);

function requestForm(email = "owner@example.com") {
  const data = new FormData();
  data.set("email", email);
  return data;
}

function resetForm() {
  const data = new FormData();
  data.set("token", "public-reset-token");
  data.set("password", "Password123!");
  data.set("confirmPassword", "Password123!");
  return data;
}

describe("password reset actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_APP_URL =
      "http://localhost:3000";

    tokenFindFirst.mockResolvedValue(null);

    tokenCreate.mockResolvedValue({
      id: "reset-1",
    } as never);

    tokenDeleteMany.mockResolvedValue({
      count: 1,
    });

    tx.passwordResetToken.updateMany.mockResolvedValue({
      count: 1,
    });

    tx.user.update.mockResolvedValue({});
  });

  it("returns the same neutral response when the account does not exist", async () => {
    userFindUnique.mockResolvedValue(null);

    const result =
      await requestPasswordResetAction(
        requestForm("missing@example.com"),
      );

    expect(result.success).toBe(true);
    expect(result.message).toContain(
      "Se esiste un account",
    );
    expect(mockedSendEmail).not.toHaveBeenCalled();
    expect(tokenCreate).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends the reset email for an active account", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    } as never);

    await requestPasswordResetAction(requestForm());

    expect(tokenCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        tokenHash: "reset-token-hash",
        expiresAt: new Date(
          "2026-09-06T12:30:00.000Z",
        ),
      },
      select: {
        id: true,
      },
    });

    expect(mockedSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "owner@example.com",
        subject: "Horizon · Reimposta la password",
        html: expect.stringContaining(
          "/reset-password/public-reset-token",
        ),
      }),
    );
  });

  it("does not generate another email during the cooldown", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    } as never);

    tokenFindFirst.mockResolvedValue({
      id: "recent-reset",
    } as never);

    await requestPasswordResetAction(requestForm());

    expect(tokenCreate).not.toHaveBeenCalled();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it("removes the newly created token if email delivery fails", async () => {
    userFindUnique.mockResolvedValue({
      id: "user-1",
      status: "ACTIVE",
      passwordHash: "existing-hash",
    } as never);

    mockedSendEmail.mockRejectedValueOnce(
      new Error("email unavailable"),
    );

    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result =
      await requestPasswordResetAction(requestForm());

    expect(tokenDeleteMany).toHaveBeenCalledWith({
      where: {
        id: "reset-1",
      },
    });
    expect(result.success).toBe(true);

    consoleError.mockRestore();
  });

  it("updates the password and consumes all remaining reset tokens", async () => {
    tokenFindUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      user: {
        status: "ACTIVE",
      },
    } as never);

    const result =
      await resetPasswordAction(resetForm());

    expect(tx.user.update).toHaveBeenCalledWith({
      where: {
        id: "user-1",
      },
      data: {
        passwordHash: "bcrypt-hash",
      },
    });

    expect(
      tx.passwordResetToken.updateMany,
    ).toHaveBeenLastCalledWith({
      where: {
        userId: "user-1",
        usedAt: null,
      },
      data: {
        usedAt: expect.any(Date),
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects an expired or already used token", async () => {
    tokenFindUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: null,
      user: {
        status: "ACTIVE",
      },
    } as never);

    await expect(
      resetPasswordAction(resetForm()),
    ).rejects.toThrow(
      "non valido o scaduto",
    );

    expect(
      prisma.$transaction,
    ).not.toHaveBeenCalled();
  });

  it("rejects passwords that do not match", async () => {
    const data = resetForm();
    data.set("confirmPassword", "DifferentPassword!");

    await expect(
      resetPasswordAction(data),
    ).rejects.toThrow("non coincidono");

    expect(tokenFindUnique).not.toHaveBeenCalled();
  });
});
