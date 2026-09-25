import { LocalStorageProvider } from "./local-storage-provider";
import { getStorageConfig } from "./storage-config";
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage-provider";
import { SupabaseStorageProvider } from "./supabase-storage-provider";

let resolvedProvider: StorageProvider | null = null;

function createDefaultStorageProvider(): StorageProvider {
  const config = getStorageConfig();

  if (config.provider === "local") {
    return new LocalStorageProvider();
  }

  return new SupabaseStorageProvider({
    url: config.url,
    secretKey: config.secretKey,
    bucket: config.bucket,
  });
}

function getDefaultStorageProvider(): StorageProvider {
  if (!resolvedProvider) {
    resolvedProvider = createDefaultStorageProvider();
  }

  return resolvedProvider;
}

export const defaultStorageProvider: StorageProvider = {
  upload(
    input: StorageUploadInput,
  ): Promise<StorageUploadResult> {
    return getDefaultStorageProvider().upload(input);
  },

  delete(key: string): Promise<void> {
    return getDefaultStorageProvider().delete(key);
  },
};
