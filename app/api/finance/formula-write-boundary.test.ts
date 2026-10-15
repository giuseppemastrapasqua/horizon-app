import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  ids: vi.fn(),
  permission: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  formula: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/guards", () => ({ getAccessiblePropertyIds: mocks.ids }));
vi.mock("@/lib/auth/management", () => ({
  requireFinanceProperty: mocks.permission,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    financeFormula: { findUnique: mocks.formula },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/finance/service/create-finance-formula", () => ({
  validateCreateFormulaPayload: () => null,
  createFinanceFormula: mocks.create,
}));
vi.mock("@/lib/finance/service/update-finance-formula", () => ({
  validateUpdateFormulaPayload: () => null,
  updateFinanceFormula: mocks.update,
}));
vi.mock("@/services/audit/AuditService", () => ({
  AuditService: { log: vi.fn() },
}));
import { POST } from "./formulas/route";
import { PUT, DELETE } from "./formulas/[formulaId]/route";
const context = { params: Promise.resolve({ formulaId: "formula-1" }) };
const payload = {
  scope: "SINGLE_PROPERTY",
  propertyId: "own",
  name: "Formula",
  rules: [],
};
function request(method: string) {
  return new Request("https://example.test/api/finance/formulas", {
    method,
    ...(method === "DELETE" ? {} : { body: JSON.stringify(payload) }),
  });
}

describe("formula write permission differs from visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "viewer-manager", role: "MANAGER" },
    });
    mocks.ids.mockResolvedValue(["own"]);
    mocks.permission.mockRejectedValue(
      new Error("read-only property assignment"),
    );
    mocks.formula.mockResolvedValue({
      id: "formula-1",
      scope: "SINGLE_PROPERTY",
      propertyId: "own",
    });
  });
  it("rejects POST when a visible property lacks finance management access", async () => {
    expect((await POST(request("POST"))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.permission).toHaveBeenCalledWith("own");
  });
  it("rejects PUT before updating rules", async () => {
    expect((await PUT(request("PUT"), context)).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rejects DELETE before opening a transaction", async () => {
    expect((await DELETE(request("DELETE"), context)).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("denies OWNER directly before property or formula queries", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner", role: "OWNER" } });
    expect((await POST(request("POST"))).status).toBe(403);
    expect(mocks.ids).not.toHaveBeenCalled();
    expect(mocks.formula).not.toHaveBeenCalled();
  });
});
