import { LocalStorageProvider } from "./local-storage-provider";
import { getStorageConfig } from "./storage-config";
import type { StorageProvider } from "./storage-provider";
import { SupabaseStorageProvider } from "./supabase-storage-provider";

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

export const defaultStorageProvider =
  createDefaultStorageProvider();