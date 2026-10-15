import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  access: vi.fn(),
  document: vi.fn(),
  pdf: vi.fn(),
  logo: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({
  requireUser: mocks.user,
  requirePropertyAccess: mocks.access,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { document: { findUnique: mocks.document } },
}));
vi.mock("@/lib/pdf/commission-invoice", () => ({
  buildCommissionInvoicePdf: mocks.pdf,
}));
vi.mock("@/lib/invoices/resolve-billing-issuer-logo", () => ({
  resolveBillingIssuerLogo: mocks.logo,
}));
import { GET } from "./route";
const context = { params: Promise.resolve({ invoiceId: "invoice-1" }) };
describe("invoice PDF publication boundary", () => {
  beforeEach(() => vi.resetAllMocks());
  it("does not expose draft invoices to OWNER even by direct URL", async () => {
    mocks.user.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.document.mockResolvedValue({
      id: "invoice-1",
      type: "COMMISSION_INVOICE",
      status: "DRAFT",
      propertyId: "own",
    });
    expect(
      (
        await GET(
          new Request("https://example.test/invoices/invoice-1/pdf"),
          context,
        )
      ).status,
    ).toBe(404);
    expect(mocks.access).toHaveBeenCalledWith("own");
    expect(mocks.pdf).not.toHaveBeenCalled();
    expect(mocks.logo).not.toHaveBeenCalled();
  });
  it("denies OPERATOR before loading financial data", async () => {
    mocks.user.mockResolvedValue({ id: "operator-1", role: "OPERATOR" });
    expect(
      (
        await GET(
          new Request("https://example.test/invoices/invoice-1/pdf"),
          context,
        )
      ).status,
    ).toBe(403);
    expect(mocks.document).not.toHaveBeenCalled();
  });
  it("returns 404 without generating a PDF for a foreign property", async () => {
    mocks.user.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.document.mockResolvedValue({
      id: "invoice-1",
      type: "COMMISSION_INVOICE",
      status: "FINAL",
      propertyId: "foreign",
    });
    mocks.access.mockRejectedValue(
      new Error("Accesso alla struttura non autorizzato."),
    );
    const response = await GET(
      new Request("https://example.test/invoices/invoice-1/pdf"),
      context,
    );
    expect(response.status).toBe(404);
    expect(mocks.pdf).not.toHaveBeenCalled();
    expect(mocks.logo).not.toHaveBeenCalled();
  });
  it("preserves database failures as failures rather than hiding them as access denial", async () => {
    mocks.user.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.document.mockResolvedValue({
      id: "invoice-1",
      type: "COMMISSION_INVOICE",
      status: "FINAL",
      propertyId: "own",
    });
    mocks.access.mockRejectedValue(new Error("database unavailable"));
    await expect(
      GET(new Request("https://example.test/invoices/invoice-1/pdf"), context),
    ).rejects.toThrow("database unavailable");
  });
});
