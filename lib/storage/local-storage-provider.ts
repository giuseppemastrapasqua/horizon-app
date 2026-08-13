import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage-provider";

const LOCAL_UPLOAD_DIRECTORY = path.join(
  process.cwd(),
  "public",
  "uploads",
);

const LOCAL_UPLOAD_PUBLIC_BASE_URL = "/uploads";

export class LocalStorageProvider implements StorageProvider {
  async upload(
    input: StorageUploadInput,
  ): Promise<StorageUploadResult> {
    const safeKey = this.normalizeKey(input.key);
    const destinationPath = this.resolveStoragePath(safeKey);

    await mkdir(path.dirname(destinationPath), {
      recursive: true,
    });

    await writeFile(destinationPath, input.data);

    return {
      key: safeKey,
      url: this.createPublicUrl(safeKey),
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const safeKey = this.normalizeKey(key);
    const destinationPath = this.resolveStoragePath(safeKey);

    try {
      await unlink(destinationPath);
    } catch (error) {
      if (this.isFileNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  private normalizeKey(key: string): string {
    const normalizedKey = path.posix
      .normalize(key.replaceAll("\\", "/"))
      .replace(/^\/+/, "");

    if (
      !normalizedKey ||
      normalizedKey === "." ||
      normalizedKey === ".." ||
      normalizedKey.startsWith("../")
    ) {
      throw new Error("Chiave storage non valida.");
    }

    return normalizedKey;
  }

  private resolveStoragePath(key: string): string {
    const destinationPath = path.join(
      LOCAL_UPLOAD_DIRECTORY,
      ...key.split("/"),
    );

    const relativePath = path.relative(
      LOCAL_UPLOAD_DIRECTORY,
      destinationPath,
    );

    if (
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(
        "Il percorso richiesto è esterno alla directory storage.",
      );
    }

    return destinationPath;
  }

  private createPublicUrl(key: string): string {
    const encodedKey = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");

    return `${LOCAL_UPLOAD_PUBLIC_BASE_URL}/${encodedKey}`;
  }

  private isFileNotFoundError(
    error: unknown,
  ): error is NodeJS.ErrnoException {
    return (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    );
  }
}