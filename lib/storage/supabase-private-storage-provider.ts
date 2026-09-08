import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import type {
  PrivateStorageProvider,
  PrivateStorageUploadInput,
  PrivateStorageUploadResult,
} from "./private-storage-provider";

type SupabasePrivateStorageProviderOptions = {
  url: string;
  secretKey: string;
  bucket: string;
};

export class SupabasePrivateStorageProvider
  implements PrivateStorageProvider
{
  private readonly client: SupabaseClient;
  private readonly bucket: string;

  constructor({
    url,
    secretKey,
    bucket,
  }: SupabasePrivateStorageProviderOptions) {
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
    input: PrivateStorageUploadInput,
  ): Promise<PrivateStorageUploadResult> {
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
        `Impossibile caricare il file sullo storage privato Supabase: ${error.message}`,
      );
    }

    return {
      key,
      size: input.data.byteLength,
      contentType: input.contentType,
    };
  }

  async read(key: string): Promise<Uint8Array> {
    const normalizedKey =
      normalizeStorageKey(key);

    const { data, error } = await this.client.storage
      .from(this.bucket)
      .download(normalizedKey);

    if (error) {
      throw new Error(
        `Impossibile leggere il file dallo storage privato Supabase: ${error.message}`,
      );
    }

    if (!data) {
      throw new Error(
        "Lo storage privato Supabase non ha restituito il file richiesto.",
      );
    }

    return new Uint8Array(
      await data.arrayBuffer(),
    );
  }

  async delete(key: string): Promise<void> {
    const normalizedKey =
      normalizeStorageKey(key);

    const { error } = await this.client.storage
      .from(this.bucket)
      .remove([normalizedKey]);

    if (error) {
      throw new Error(
        `Impossibile eliminare il file dallo storage privato Supabase: ${error.message}`,
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

  const segments =
    normalizedKey.split("/");

  if (
    !normalizedKey ||
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
