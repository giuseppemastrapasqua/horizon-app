import { beforeEach, describe, expect, it, vi } from "vitest";

const storageUploadMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/storage/default-storage-provider", () => ({
  defaultStorageProvider: {
    upload: storageUploadMock,
    delete: vi.fn(),
  },
}));

import { uploadBillingIssuerLogo } from "./upload-billing-issuer-logo";

describe("uploadBillingIssuerLogo", () => {
  beforeEach(() => {
    storageUploadMock.mockReset();
  });

  it("carica un PNG con firma valida", async () => {
    const bytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const file = new File(
      [bytes],
      "logo.png",
      { type: "image/png" },
    );

    storageUploadMock.mockResolvedValueOnce({
      key: "billing-issuers/DEFAULT/logo.png",
      url: "/uploads/logo.png",
      size: bytes.length,
      contentType: "image/png",
    });

    await uploadBillingIssuerLogo(file);

    expect(storageUploadMock).toHaveBeenCalledOnce();

    expect(storageUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: bytes,
        contentType: "image/png",
      }),
    );
  });

  it("rifiuta un logo con MIME immagine ma contenuto non valido", async () => {
    const file = new File(
      [new TextEncoder().encode("<script>alert('x')</script>")],
      "fake.png",
      { type: "image/png" },
    );

    await expect(
      uploadBillingIssuerLogo(file),
    ).rejects.toThrow(
      "Il contenuto del logo non corrisponde a un'immagine supportata.",
    );

    expect(storageUploadMock).not.toHaveBeenCalled();
  });

  it("rifiuta un logo valido quando il MIME dichiarato non corrisponde alla firma", async () => {
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0,
    ]);

    const file = new File(
      [jpegBytes],
      "fake.png",
      { type: "image/png" },
    );

    await expect(
      uploadBillingIssuerLogo(file),
    ).rejects.toThrow(
      "Il contenuto del logo non corrisponde al formato dichiarato.",
    );

    expect(storageUploadMock).not.toHaveBeenCalled();
  });
});
