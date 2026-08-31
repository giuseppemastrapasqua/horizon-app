import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  redirect: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mocks.auth,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
    },
  },
}));

import {
  getAccessiblePropertyIds,
  requirePropertyAccess,
} from "@/lib/auth/guards";

describe("property access guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gives SUPER_ADMIN global property access without querying Prisma", async () => {
    const user = { id: "admin-1", role: "SUPER_ADMIN" };

    mocks.auth.mockResolvedValue({ user });

    await expect(requirePropertyAccess("property-1")).resolves.toEqual(user);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("checks ownership, PropertyAccess and task assignment for non-admin users", async () => {
    const user = { id: "manager-1", role: "MANAGER" };

    mocks.auth.mockResolvedValue({ user });
    mocks.findFirst.mockResolvedValue({ id: "property-1" });

    await expect(requirePropertyAccess("property-1")).resolves.toEqual(user);

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "property-1",
        OR: [
          { ownerId: "manager-1" },
          {
            accesses: {
              some: {
                userId: "manager-1",
                active: true,
              },
            },
          },
          {
            taskAssignments: {
              some: {
                userId: "manager-1",
                active: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });
  });

  it("rejects access when no authorization exists", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "user-1", role: "MANAGER" },
    });

    mocks.findFirst.mockResolvedValue(null);

    await expect(
      requirePropertyAccess("property-1"),
    ).rejects.toThrow("Accesso alla struttura non autorizzato.");
  });

  it("returns null property filter for SUPER_ADMIN", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin-1", role: "SUPER_ADMIN" },
    });

    await expect(getAccessiblePropertyIds()).resolves.toBeNull();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("returns only authorized property ids for non-admin users", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "finance-1", role: "FINANCE_ADMIN" },
    });

    mocks.findMany.mockResolvedValue([
      { id: "property-1" },
      { id: "property-2" },
    ]);

    await expect(getAccessiblePropertyIds()).resolves.toEqual([
      "property-1",
      "property-2",
    ]);

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { ownerId: "finance-1" },
          {
            accesses: {
              some: {
                userId: "finance-1",
                active: true,
              },
            },
          },
          {
            taskAssignments: {
              some: {
                userId: "finance-1",
                active: true,
              },
            },
          },
        ],
      },
      select: { id: true },
    });
  });
});