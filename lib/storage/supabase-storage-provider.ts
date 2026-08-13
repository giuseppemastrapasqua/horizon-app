import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
} from "./storage-provider";

type SupabaseStorageProviderOptions = {
  url: string;
  secretKey: string;
  bucket: string;
};

export class SupabaseStorageProvider
  implements StorageProvider
{
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor({
    url,
    secretKey,
    bucket,
  }: SupabaseStorageProviderOptions) {
    this.client = createClient(
      url,
      secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

    this.bucket = bucket;
  }

  async upload(
    input: StorageUploadInput,
  ): Promise<StorageUploadResult> {
    const key = normalizeStorageKey(input.key);

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(
        key,
        input.data,
        {
          contentType: input.contentType,
          upsert: false,
        },
      );

    if (error) {
      throw new Error(
        `Impossibile caricare il file su Supabase Storage: ${error.message}`,
      );
    }

    const {
      data: publicUrlData,
    } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(key);

    return {
      key,
      url: publicUrlData.publicUrl,
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    const normalizedKey =
      normalizeStorageKey(key);

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([normalizedKey]);

    if (error) {
      throw new Error(
        `Impossibile eliminare il file da Supabase Storage: ${error.message}`,
      );
    }
  }
}

function normalizeStorageKey(
  key: string,
): string {
  const normalizedKey = key
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .trim();

  if (
    !normalizedKey ||
    normalizedKey === "." ||
    normalizedKey === ".." ||
    normalizedKey.startsWith("../")
  ) {
    throw new Error(
      "Chiave storage non valida.",
    );
  }

  return normalizedKey;
}