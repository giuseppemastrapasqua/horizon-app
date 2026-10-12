import { randomBytes } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { encryptDocument } from "@/lib/security/document-crypto";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  document: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({ requirePropertyRole: mocks.role }));
vi.mock("@/lib/prisma", () => ({
  prisma: { propertyDocument: { findFirst: mocks.document } },
}));
vi.mock("@/lib/storage/default-private-storage-provider", () => ({
  defaultPrivateStorageProvider: { read: mocks.read },
}));
import { GET } from "./route";
const context = {
  params: Promise.resolve({ id: "own-property", documentId: "contract-1" }),
};
const request = () =>
  new Request(
    "https://example.test/properties/own-property/documents/contract-1/file",
  );

describe("private document download boundary", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.role.mockResolvedValue({ id: "owner-1", role: "OWNER" });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("denies a foreign or insufficient property role before reading metadata or storage", async () => {
    mocks.role.mockRejectedValue(
      new Error("Permessi insufficienti per modificare la struttura."),
    );
    expect((await GET(request(), context)).status).toBe(404);
    expect(mocks.document).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("does not conceal a database failure in the authorization guard", async () => {
    mocks.role.mockRejectedValue(new Error("database unavailable"));
    await expect(GET(request(), context)).rejects.toThrow(
      "database unavailable",
    );
  });

  it("scopes the record and applies the owner type allowlist before any file read", async () => {
    mocks.document.mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(404);
    const query = mocks.document.mock.calls[0][0];
    expect(query.where.id).toBe("contract-1");
    expect(query.where.propertyId).toBe("own-property");
    expect(query.where.type.in).toContain("CONTRACT");
    expect(query.where.type.in).not.toContain("IDENTITY_DOCUMENT");
    expect(query.where.type.in).not.toContain("OTHER");
    expect(mocks.read).not.toHaveBeenCalled();
  });

  it("decrypts an allowed file and prevents caching or MIME sniffing", async () => {
    const key = randomBytes(32).toString("base64");
    vi.stubEnv("HORIZON_DOCUMENT_ENCRYPTION_KEY", key);
    mocks.document.mockResolvedValue({
      storageKey: "private/contract",
      filename: "contract.txt",
      contentType: "text/plain",
      encryptionVersion: "v1",
    });
    mocks.read.mockResolvedValue(
      encryptDocument(Buffer.from("allowed contract fixture"), key),
    );
    const response = await GET(request(), context);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("allowed contract fixture");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });
});
