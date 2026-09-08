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
  }),
);

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import { uploadPropertyImageAction } from "./photo-actions";

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
  });

  it("carica più immagini nell'ordine selezionato", async () => {
    const first = createImageFile("first.jpg");
    const second = createImageFile("second.png", "image/png");

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

  it("rifiuta più di 20 immaginiprima dell'upload", async () => {
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
});
