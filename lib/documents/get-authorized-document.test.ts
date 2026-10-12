import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  properties: vi.fn(),
  document: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findMany: mocks.properties },
    document: { findFirst: mocks.document },
  },
}));
import { getAuthorizedDocument } from "./get-authorized-document";

describe("administrative document detail access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it("denies OWNER before querying internal documents or versions", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "owner", role: "OWNER" } });
    await expect(getAuthorizedDocument("document-1")).rejects.toThrow(
      "non autorizzata",
    );
    expect(mocks.document).not.toHaveBeenCalled();
  });
  it("intersects document id and the manager's accessible portfolio", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "manager", role: "MANAGER" } });
    mocks.properties.mockResolvedValue([{ id: "own" }]);
    mocks.document.mockResolvedValue(null);
    await expect(getAuthorizedDocument("foreign-document")).resolves.toBeNull();
    expect(mocks.document.mock.calls[0][0].where).toEqual({
      id: "foreign-document",
      propertyId: { in: ["own"] },
    });
    expect(mocks.document.mock.calls[0][0].select).not.toHaveProperty(
      "content",
    );
  });
  it("retains SUPER_ADMIN visibility for general documents", async () => {
    mocks.auth.mockResolvedValue({
      user: { id: "admin", role: "SUPER_ADMIN" },
    });
    mocks.document.mockResolvedValue({ id: "general-document" });
    await getAuthorizedDocument("general-document");
    expect(mocks.properties).not.toHaveBeenCalled();
    expect(mocks.document.mock.calls[0][0].where).toEqual({
      id: "general-document",
    });
  });
});
