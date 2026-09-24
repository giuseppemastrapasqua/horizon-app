import { LocalPrivateStorageProvider } from "./local-private-storage-provider";
import { getPrivateStorageConfig } from "./private-storage-config";
import type {
  PrivateStorageProvider,
  PrivateStorageUploadInput,
  PrivateStorageUploadResult,
} from "./private-storage-provider";
import { SupabasePrivateStorageProvider } from "./supabase-private-storage-provider";

let resolvedProvider: PrivateStorageProvider | null = null;

function createDefaultPrivateStorageProvider(): PrivateStorageProvider {
  const config = getPrivateStorageConfig();

  if (config.provider === "local") {
    return new LocalPrivateStorageProvider(config.rootDirectory);
  }

  return new SupabasePrivateStorageProvider({
    url: config.url,
    secretKey: config.secretKey,
    bucket: config.bucket,
  });
}

function getDefaultPrivateStorageProvider(): PrivateStorageProvider {
  if (!resolvedProvider) {
    resolvedProvider = createDefaultPrivateStorageProvider();
  }

  return resolvedProvider;
}

export const defaultPrivateStorageProvider: PrivateStorageProvider = {
  upload(
    input: PrivateStorageUploadInput,
  ): Promise<PrivateStorageUploadResult> {
    return getDefaultPrivateStorageProvider().upload(input);
  },

  read(key: string): Promise<Uint8Array> {
    return getDefaultPrivateStorageProvider().read(key);
  },

  delete(key: string): Promise<void> {
    return getDefaultPrivateStorageProvider().delete(key);
  },
};
