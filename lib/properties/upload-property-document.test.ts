import { beforeEach, describe, expect, it, vi } from "vitest";

const { uploadMock } = vi.hoisted(() => ({ uploadMock: vi.fn() }));

vi.mock("@/lib/storage/default-private-storage-provider", () => ({
  defaultPrivateStorageProvider: {
    upload: uploadMock,
  },
}));

import { decryptDocument } from "@/lib/security/document-crypto";
import { uploadPropertyDocument } from "@/lib/properties/upload-property-document";

describe("uploadPropertyDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY =
      Buffer.alloc(32, 7).toString("base64");

    uploadMock.mockImplementation(async (input) => ({
      key: input.key,
      size: input.data.length,
      contentType: input.contentType,
    }));
  });

  it("cifra il contenuto prima di salvarlo nello storage privato", async () => {
    const plaintext = Buffer.from(
      "%PDF-1.7 documento riservato Horizon",
    );

    const file = new File([plaintext], "suap.pdf", {
      type: "application/pdf",
    });

    const result = await uploadPropertyDocument(
      "property-123",
      file,
    );

    expect(uploadMock).toHaveBeenCalledTimes(1);

    const uploadInput = uploadMock.mock.calls[0]?.[0];

    expect(uploadInput).toBeDefined();
    expect(uploadInput.key).toMatch(
      /^properties\/property-123\/documents\/.+\.hzdoc$/,
    );
    expect(uploadInput.contentType).toBe(
      "application/octet-stream",
    );

    expect(Buffer.from(uploadInput.data)).not.toEqual(
      plaintext,
    );

    const decrypted = decryptDocument(
      uploadInput.data,
      process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY!,
    );

    expect(Buffer.from(decrypted)).toEqual(plaintext);

    expect(result).toMatchObject({
      filename: "suap.pdf",
      contentType: "application/pdf",
      fileSize: plaintext.length,
      encryptionVersion: "v1",
    });
  });

  it("rifiuta file vuoti", async () => {
    const file = new File([], "vuoto.pdf", {
      type: "application/pdf",
    });

    await expect(
      uploadPropertyDocument("property-123", file),
    ).rejects.toThrow("Seleziona un file valido.");

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rifiuta formati non supportati", async () => {
    const file = new File(["test"], "documento.txt", {
      type: "text/plain",
    });

    await expect(
      uploadPropertyDocument("property-123", file),
    ).rejects.toThrow("Formato documento non supportato");

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("richiede una chiave documenti dedicata", async () => {
    delete process.env.HORIZON_DOCUMENT_ENCRYPTION_KEY;

    const file = new File(["test"], "documento.pdf", {
      type: "application/pdf",
    });

    await expect(
      uploadPropertyDocument("property-123", file),
    ).rejects.toThrow(
      "HORIZON_DOCUMENT_ENCRYPTION_KEY non configurata.",
    );

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rifiuta un documento con MIME consentito ma contenuto non valido", async () => {
    const file = new File(
      [new TextEncoder().encode("<script>alert('x')</script>")],
      "fake.pdf",
      { type: "application/pdf" },
    );

    await expect(
      uploadPropertyDocument("property-123", file),
    ).rejects.toThrow(
      "Il contenuto del file non corrisponde a un documento supportato.",
    );

    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("rifiuta un documento valido quando il MIME dichiarato non corrisponde alla firma", async () => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const file = new File(
      [pngBytes],
      "fake.pdf",
      { type: "application/pdf" },
    );

    await expect(
      uploadPropertyDocument("property-123", file),
    ).rejects.toThrow(
      "Il contenuto del file non corrisponde al formato dichiarato.",
    );

    expect(uploadMock).not.toHaveBeenCalled();
  });
});
