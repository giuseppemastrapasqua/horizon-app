import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const upload = vi.fn();
const download = vi.fn();
const remove = vi.fn();
const from = vi.fn(() => ({
  upload,
  download,
  remove,
}));
const getPublicUrl = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    storage: {
      from,
    },
  })),
}));

import { SupabasePrivateStorageProvider } from "./supabase-private-storage-provider";

describe("SupabasePrivateStorageProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    from.mockImplementation(() => ({
      upload,
      download,
      remove,
    }));

    upload.mockResolvedValue({
      error: null,
    });
    remove.mockResolvedValue({
      error: null,
    });
    download.mockResolvedValue({
      data: new Blob([
        Buffer.from("encrypted"),
      ]),
      error: null,
    });
  });

  it(
    "carica senza generare URL pubblici",
    async () => {
      const provider =
        new SupabasePrivateStorageProvider({
          url: "https://example.supabase.co",
          secretKey: "secret",
          bucket: "private-documents",
        });

      const result = await provider.upload({
        key: "properties/p1/documents/d1.bin",
        data: Buffer.from("encrypted"),
        contentType:
          "application/octet-stream",
      });

      expect(upload).toHaveBeenCalledWith(
        "properties/p1/documents/d1.bin",
        expect.any(Uint8Array),
        {
          contentType:
            "application/octet-stream",
          upsert: false,
        },
      );
      expect(getPublicUrl).not.toHaveBeenCalled();
      expect(result).toEqual({
        key: "properties/p1/documents/d1.bin",
        size: 9,
        contentType:
          "application/octet-stream",
      });
    },
  );

  it(
    "legge un oggetto privato tramite download",
    async () => {
      const provider =
        new SupabasePrivateStorageProvider({
          url: "https://example.supabase.co",
          secretKey: "secret",
          bucket: "private-documents",
        });

      const data = await provider.read(
        "properties/p1/documents/d1.bin",
      );

      expect(download).toHaveBeenCalledWith(
        "properties/p1/documents/d1.bin",
      );
      expect(
        Buffer.from(data).toString("utf8"),
      ).toBe("encrypted");
    },
  );

  it(
    "elimina un oggetto privato",
    async () => {
      const provider =
        new SupabasePrivateStorageProvider({
          url: "https://example.supabase.co",
          secretKey: "secret",
          bucket: "private-documents",
        });

      await provider.delete(
        "properties/p1/documents/d1.bin",
      );

      expect(remove).toHaveBeenCalledWith([
        "properties/p1/documents/d1.bin",
      ]);
    },
  );

  it(
    "rifiuta path traversal",
    async () => {
      const provider =
        new SupabasePrivateStorageProvider({
          url: "https://example.supabase.co",
          secretKey: "secret",
          bucket: "private-documents",
        });

      await expect(
        provider.read("../outside.bin"),
      ).rejects.toThrow(
        "Chiave storage privata non valida.",
      );
    },
  );
});
