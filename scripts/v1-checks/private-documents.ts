import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { PrismaClient, PropertyDocumentType } from "@prisma/client";
import { encryptDocument } from "../../lib/security/document-crypto";
import { LocalPrivateStorageProvider } from "../../lib/storage/local-private-storage-provider";
import { assertIsolatedDatabase, propertyA, propertyB } from "./seed";
import { TestClient, expectStatus } from "./http-client";

const plaintext = Buffer.from("V1_PRIVATE_ENCRYPTED_CONTRACT_CONTENT");
const definitions: Array<[string, string, PropertyDocumentType]> = [
  ["contract-alpha", propertyA, "CONTRACT"],
  ["identity-alpha", propertyA, "IDENTITY_DOCUMENT"],
  ["other-alpha", propertyA, "OTHER"],
  ["contract-beta", propertyB, "CONTRACT"],
  ["corrupt-alpha", propertyA, "CONTRACT"],
];

export async function seedPrivateDocuments(prisma: PrismaClient) {
  assertIsolatedDatabase();
  const root = await mkdtemp(join(tmpdir(), "horizon-v1-private-test-"));
  process.env.PRIVATE_STORAGE_PROVIDER = "local";
  process.env.HORIZON_PRIVATE_STORAGE_DIR = root;
  process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY =
    randomBytes(32).toString("base64");
  const storage = new LocalPrivateStorageProvider(root);
  try {
    for (const [id, propertyId, type] of definitions) {
      const key = `isolated/${id}.enc`;
      const encrypted = Buffer.from(
        encryptDocument(plaintext, process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY),
      );
      if (id === "corrupt-alpha") encrypted[encrypted.length - 1] ^= 1;
      await storage.upload({
        key,
        data: encrypted,
        contentType: "application/octet-stream",
      });
      assert.ok(
        !Buffer.from(await storage.read(key)).includes(plaintext),
        "Stored file must not contain plaintext.",
      );
      await prisma.propertyDocument.create({
        data: {
          id: `v1-file-${id}`,
          propertyId,
          type,
          title: `V1_PRIVATE_FILE_${id}`,
          storageKey: key,
          filename: `${id}.txt`,
          contentType: "text/plain",
          encryptionVersion: "v1",
          notes: "PRIVATE_DOCUMENT_INTERNAL_NOTE",
        },
      });
    }
    return root;
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}

export async function verifyPrivateDocuments(clients: Map<string, TestClient>) {
  const a = clients.get("ownerA")!;
  const path = (property: string, id: string) =>
    `/properties/${property}/documents/v1-file-${id}/file`;
  const contract = await expectStatus(a, path(propertyA, "contract-alpha"), [
    200,
  ]);
  assert.deepEqual(Buffer.from(await contract.arrayBuffer()), plaintext);
  assert.equal(contract.headers.get("cache-control"), "private, no-store");
  assert.equal(contract.headers.get("x-content-type-options"), "nosniff");
  assert.ok(
    contract.headers.get("content-disposition")?.includes("contract-alpha.txt"),
  );
  for (const id of ["identity-alpha", "other-alpha", "contract-beta"]) {
    const denied = await expectStatus(a, path(propertyA, id), [404]);
    assert.ok(!(await denied.text()).includes(plaintext.toString()));
  }
  await expectStatus(a, path(propertyB, "contract-beta"), [404]);
  await expectStatus(
    clients.get("ownerB")!,
    path(propertyA, "contract-alpha"),
    [404],
  );
  for (const name of ["operator", "finance"])
    await expectStatus(clients.get(name)!, path(propertyA, "contract-alpha"), [
      404,
    ]);
  const manager = await expectStatus(
    clients.get("manager")!,
    path(propertyA, "identity-alpha"),
    [200],
  );
  assert.deepEqual(Buffer.from(await manager.arrayBuffer()), plaintext);
  const corrupt = await expectStatus(a, path(propertyA, "corrupt-alpha"), [
    500,
  ]);
  assert.equal(await corrupt.text(), "Impossibile aprire il documento.");
  const anonymous = await expectStatus(
    new TestClient(),
    path(propertyA, "contract-alpha"),
    [307],
  );
  assert.equal(anonymous.headers.get("location"), "/login");
}
