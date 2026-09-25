import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requirePropertyRoleMock = vi.hoisted(() =>
  vi.fn(),
);

const createPropertyImageMock = vi.hoisted(() =>
  vi.fn(),
);

const createPropertyImageFromUploadedObjectMock = vi.hoisted(
  () => vi.fn(),
);

const createPublicStorageSignedUploadMock = vi.hoisted(
  () => vi.fn(),
);

const readPublicStorageObjectMock = vi.hoisted(() =>
  vi.fn(),
);

const deletePublicStorageObjectMock = vi.hoisted(() =>
  vi.fn(),
);

const getPublicStorageUrlMock = vi.hoisted(() =>
  vi.fn(),
);

const revalidatePathMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock(
  "@/lib/application/properties/create-property-image",
  () => ({
    createPropertyImage: createPropertyImageMock,
    createPropertyImageFromUploadedObject:
      createPropertyImageFromUploadedObjectMock,
  }),
);

vi.mock(
  "@/lib/storage/supabase-public-storage-direct-upload",
  () => ({
    createPublicStorageSignedUpload:
      createPublicStorageSignedUploadMock,
    readPublicStorageObject: readPublicStorageObjectMock,
    deletePublicStorageObject:
      deletePublicStorageObjectMock,
    getPublicStorageUrl: getPublicStorageUrlMock,
  }),
);

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  finalizePropertyImageUploadAction,
  preparePropertyImageUploadAction,
  uploadPropertyImageAction,
} from "./photo-actions";

function createFormData(files: File[]): FormData {
  const formData = new FormData();

  formData.set("propertyId", "property-1");

  for (const file of files) {
    formData.append("files", file);
  }

  return formData;
}

function createImageFile(
  name: string,
  type = "image/jpeg",
  size = 10,
): File {
  return new File(
    [new Uint8Array(size)],
    name,
    { type },
  );
}

describe("property photo actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePropertyRoleMock.mockResolvedValue(undefined);

    createPropertyImageMock.mockResolvedValue({
      imageId: "image-1",
      url: "/uploads/image.jpg",
      filename: "properties/property-1/image.jpg",
      sortOrder: 0,
      isCover: true,
    });

    createPropertyImageFromUploadedObjectMock.mockResolvedValue({
      imageId: "image-2",
      url: "https://storage.example/photo.jpg",
      filename: "properties/property-1/photo.jpg",
      sortOrder: 0,
      isCover: true,
    });

    createPublicStorageSignedUploadMock.mockImplementation(
      async (key: string) => ({
        key,
        signedUrl:
          "https://storage.example/upload?token=test",
        token: "test",
      }),
    );

    deletePublicStorageObjectMock.mockResolvedValue(undefined);

    getPublicStorageUrlMock.mockImplementation(
      (key: string) =>
        `https://storage.example/${key}`,
    );
  });

  it("carica più immagini nell'ordine selezionato", async () => {
    const first = createImageFile("first.jpg");
    const second = createImageFile(
      "second.png",
      "image/png",
    );

    await uploadPropertyImageAction(
      createFormData([first, second]),
    );

    expect(requirePropertyRoleMock).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(createPropertyImageMock).toHaveBeenNthCalledWith(
      1,
      {
        propertyId: "property-1",
        file: first,
      },
    );

    expect(createPropertyImageMock).toHaveBeenNthCalledWith(
      2,
      {
        propertyId: "property-1",
        file: second,
      },
    );

    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });

  it("rifiuta un batch vuoto", async () => {
    await expect(
      uploadPropertyImageAction(createFormData([])),
    ).rejects.toThrow(
      "Seleziona almeno un'immagine da caricare.",
    );

    expect(requirePropertyRoleMock).not.toHaveBeenCalled();
    expect(createPropertyImageMock).not.toHaveBeenCalled();
  });

  it("rifiuta più di 20 immagini prima dell'upload", async () => {
    const files = Array.from(
      { length: 21 },
      (_, index) =>
        createImageFile(`image-${index + 1}.jpg`),
    );

    await expect(
      uploadPropertyImageAction(createFormData(files)),
    ).rejects.toThrow(
      "Puoi caricare al massimo 20 immagini alla volta.",
    );

    expect(requirePropertyRoleMock).not.toHaveBeenCalled();
    expect(createPropertyImageMock).not.toHaveBeenCalled();
  });

  it("rifiuta l'intero batch se una foto supera 10 MB", async () => {
    const valid = createImageFile("valid.jpg");
    const oversized = createImageFile(
      "large.jpg",
      "image/jpeg",
      10 * 1024 * 1024 + 1,
    );

    await expect(
      uploadPropertyImageAction(
        createFormData([valid, oversized]),
      ),
    ).rejects.toThrow(
      'L\'immagine "large.jpg" supera la dimensione massima di 10 MB.',
    );

    expect(requirePropertyRoleMock).not.toHaveBeenCalled();
    expect(createPropertyImageMock).not.toHaveBeenCalled();
  });

  it("rifiuta l'intero batch se il formato non è supportato", async () => {
    const valid = createImageFile("valid.jpg");
    const invalid = createImageFile(
      "invalid.gif",
      "image/gif",
    );

    await expect(
      uploadPropertyImageAction(
        createFormData([valid, invalid]),
      ),
    ).rejects.toThrow(
      "L'immagine \"invalid.gif\" ha un formato non supportato.",
    );

    expect(requirePropertyRoleMock).not.toHaveBeenCalled();
    expect(createPropertyImageMock).not.toHaveBeenCalled();
  });

  it("prepara un upload diretto con una chiave isolata per struttura", async () => {
    const result =
      await preparePropertyImageUploadAction({
        propertyId: "property-1",
        originalFilename: "photo.jpg",
        mimeType: "image/jpeg",
        size: 1024,
      });

    expect(requirePropertyRoleMock).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(
      createPublicStorageSignedUploadMock,
    ).toHaveBeenCalledTimes(1);

    const key =
      createPublicStorageSignedUploadMock.mock.calls[0][0];

    expect(key).toMatch(
      /^properties\/property-1\/[0-9a-f-]{36}\.jpg$/,
    );

    expect(result).toEqual({
      key,
      signedUrl:
        "https://storage.example/upload?token=test",
      token: "test",
    });
  });

  it("finalizza una JPEG verificata nello storage", async () => {
    const key =
      "properties/property-1/123e4567-e89b-42d3-a456-426614174000.jpg";

    const bytes = new Uint8Array([
      0xff,
      0xd8,
      0xff,
      0x00,
      0x00,
    ]);

    readPublicStorageObjectMock.mockResolvedValue(bytes);

    await finalizePropertyImageUploadAction({
      propertyId: "property-1",
      key,
      originalFilename: "photo.jpg",
      mimeType: "image/jpeg",
      size: bytes.byteLength,
    });

    expect(requirePropertyRoleMock).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(readPublicStorageObjectMock).toHaveBeenCalledWith(
      key,
    );

    expect(
      createPropertyImageFromUploadedObjectMock,
    ).toHaveBeenCalledWith({
      propertyId: "property-1",
      key,
      url: `https://storage.example/${key}`,
      originalFilename: "photo.jpg",
      mimeType: "image/jpeg",
      size: bytes.byteLength,
    });

    expect(
      deletePublicStorageObjectMock,
    ).not.toHaveBeenCalled();

    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });

  it("rifiuta un file con MIME JPEG ma firma non valida e lo elimina", async () => {
    const key =
      "properties/property-1/123e4567-e89b-42d3-a456-426614174000.jpg";

    const bytes = new Uint8Array([
      0x47,
      0x49,
      0x46,
      0x38,
      0x39,
    ]);

    readPublicStorageObjectMock.mockResolvedValue(bytes);

    await expect(
      finalizePropertyImageUploadAction({
        propertyId: "property-1",
        key,
        originalFilename: "fake.jpg",
        mimeType: "image/jpeg",
        size: bytes.byteLength,
      }),
    ).rejects.toThrow();

    expect(
      createPropertyImageFromUploadedObjectMock,
    ).not.toHaveBeenCalled();

    expect(
      deletePublicStorageObjectMock,
    ).toHaveBeenCalledWith(key);
  });
});
