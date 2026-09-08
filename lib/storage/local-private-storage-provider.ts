import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

import type {
  PrivateStorageProvider,
  PrivateStorageUploadInput,
  PrivateStorageUploadResult,
} from "./private-storage-provider";

export class LocalPrivateStorageProvider
  implements PrivateStorageProvider
{
  private readonly rootDirectory: string;

  constructor(
    rootDirectory = getDefaultRootDirectory(),
  ) {
    this.rootDirectory = path.resolve(rootDirectory);
  }

  async upload(
    input: PrivateStorageUploadInput,
  ): Promise<PrivateStorageUploadResult> {
    const normalizedKey = normalizeKey(input.key);
    const targetPath = this.resolveKey(normalizedKey);

    await mkdir(path.dirname(targetPath), {
      recursive: true,
    });

    await writeFile(
      targetPath,
      Buffer.from(input.data),
    );

    return {
      key: normalizedKey,
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async read(key: string): Promise<Uint8Array> {
    const normalizedKey = normalizeKey(key);
    const targetPath = this.resolveKey(normalizedKey);

    return readFile(targetPath);
  }

  async delete(key: string): Promise<void> {
    const normalizedKey = normalizeKey(key);
    const targetPath = this.resolveKey(normalizedKey);

    try {
      await unlink(targetPath);
    } catch (error) {
      if (
        isNodeError(error) &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }
  }

  private resolveKey(key: string): string {
    const targetPath = path.resolve(
      this.rootDirectory,
      ...key.split("/"),
    );

    const relativePath = path.relative(
      this.rootDirectory,
      targetPath,
    );

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(
        "Chiave storage privata non valida.",
      );
    }

    return targetPath;
  }
}

function getDefaultRootDirectory(): string {
  const configuredDirectory =
    process.env.HORIZON_PRIVATE_STORAGE_DIR?.trim();

  if (configuredDirectory) {
    return configuredDirectory;
  }

  return path.join(
    process.cwd(),
    ".horizon-private",
    "documents",
  );
}

function normalizeKey(key: string): string {
  const normalizedKey = key
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!normalizedKey) {
    throw new Error(
      "Chiave storage privata non valida.",
    );
  }

  const segments = normalizedKey.split("/");

  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new Error(
      "Chiave storage privata non valida.",
    );
  }

  return segments.join("/");
}

function isNodeError(
  error: unknown,
): error is NodeJS.ErrnoException {
  return error instanceof Error;
}
