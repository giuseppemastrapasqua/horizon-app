import { beforeEach, describe, expect, it, vi } from "vitest";

const storageUploadMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/storage/default-storage-provider", () => ({
  defaultStorageProvider: {
    upload: storageUploadMock,
    delete: vi.fn(),
  },
}));

import { uploadPropertyImage } from "./upload-property-image";

describe("uploadPropertyImage", () => {
  beforeEach(() => {
    storageUploadMock.mockReset();
  });

  it("carica un WebP con firma valida", async () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46,
      0x04, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50,
    ]);

    const file = new File(
      [bytes],
      "photo.webp",
      { type: "image/webp" },
    );

    storageUploadMock.mockResolvedValueOnce({
      key: "properties/property-1/photo.webp",
      url: "/uploads/photo.webp",
      size: bytes.length,
      contentType: "image/webp",
    });

    await uploadPropertyImage({
      propertyId: "property-1",
      file,
    });

    expect(storageUploadMock).toHaveBeenCalledOnce();

    expect(storageUploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: bytes,
        contentType: "image/webp",
      }),
    );
  });

  it("rifiuta un file con MIME immagine ma contenuto non valido", async () => {
    const file = new File(
      [new TextEncoder().encode("<script>alert('x')</script>")],
      "fake.webp",
      { type: "image/webp" },
    );

    await expect(
      uploadPropertyImage({
        propertyId: "property-1",
        file,
      }),
    ).rejects.toThrow("Il contenuto del file non corrisponde a un'immagine supportata.");

    expect(storageUploadMock).not.toHaveBeenCalled();
  });
  it("rifiuta un'immagine valida quando il MIME dichiarato non corrisponde alla firma", async () => {
    const pngBytes = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const file = new File(
      [pngBytes],
      "fake.jpg",
      { type: "image/jpeg" },
    );

    await expect(
      uploadPropertyImage({
        propertyId: "property-1",
        file,
      }),
    ).rejects.toThrow(
      "Il contenuto del file non corrisponde al formato dichiarato.",
    );

    expect(storageUploadMock).not.toHaveBeenCalled();
  });
});
