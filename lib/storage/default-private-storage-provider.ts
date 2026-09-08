import { LocalPrivateStorageProvider } from "./local-private-storage-provider";
import { getPrivateStorageConfig } from "./private-storage-config";
import type { PrivateStorageProvider } from "./private-storage-provider";
import { SupabasePrivateStorageProvider } from "./supabase-private-storage-provider";

function createDefaultPrivateStorageProvider(): PrivateStorageProvider {
  const config = getPrivateStorageConfig();

  if (config.provider === "local") {
    return new LocalPrivateStorageProvider(
      config.rootDirectory,
    );
  }

  return new SupabasePrivateStorageProvider({
    url: config.url,
    secretKey: config.secretKey,
    bucket: config.bucket,
  });
}

export const defaultPrivateStorageProvider =
  createDefaultPrivateStorageProvider();
