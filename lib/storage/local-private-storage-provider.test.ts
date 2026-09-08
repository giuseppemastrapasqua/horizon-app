import {
  mkdtemp,
  readFile,
  rm,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { LocalPrivateStorageProvider } from "./local-private-storage-provider";

const temporaryDirectories: string[] = [];

async function createProvider() {
  const rootDirectory = await mkdtemp(
    path.join(
      os.tmpdir(),
      "horizon-private-storage-",
    ),
  );

  temporaryDirectories.push(rootDirectory);

  return {
    provider:
      new LocalPrivateStorageProvider(
        rootDirectory,
      ),
    rootDirectory,
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(
      (directory) =>
        rm(directory, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe("LocalPrivateStorageProvider", () => {
  it(
    "scrive e legge un oggetto privato",
    async () => {
      const { provider, rootDirectory } =
        await createProvider();
      const data = Buffer.from(
        "encrypted-document",
        "utf8",
      );

      const result = await provider.upload({
        key: "properties/p1/documents/d1.bin",
        data,
        contentType:
          "application/octet-stream",
      });

      expect(result).toEqual({
        key: "properties/p1/documents/d1.bin",
        size: data.byteLength,
        contentType:
          "application/octet-stream",
      });

      const stored = await readFile(
        path.join(
          rootDirectory,
          "properties",
          "p1",
          "documents",
          "d1.bin",
        ),
      );

      expect(stored.equals(data)).toBe(true);

      const loaded = await provider.read(
        result.key,
      );

      expect(
        Buffer.from(loaded).equals(data),
      ).toBe(true);
    },
  );

  it(
    "elimina un oggetto e rende delete idempotente",
    async () => {
      const { provider } =
        await createProvider();

      await provider.upload({
        key: "documents/d1.bin",
        data: Buffer.from("data"),
        contentType:
          "application/octet-stream",
      });

      await provider.delete(
        "documents/d1.bin",
      );

      await expect(
        provider.read("documents/d1.bin"),
      ).rejects.toMatchObject({
        code: "ENOENT",
      });

      await expect(
        provider.delete(
          "documents/d1.bin",
        ),
      ).resolves.toBeUndefined();
    },
  );

  it(
    "rifiuta path traversal",
    async () => {
      const { provider } =
        await createProvider();

      await expect(
        provider.upload({
          key: "../outside.bin",
          data: Buffer.from("data"),
          contentType:
            "application/octet-stream",
        }),
      ).rejects.toThrow(
        "Chiave storage privata non valida.",
      );

      await expect(
        provider.read(
          "documents/../../outside.bin",
        ),
      ).rejects.toThrow(
        "Chiave storage privata non valida.",
      );
    },
  );
});
