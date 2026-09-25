import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import { getStorageConfig } from "./storage-config";

type SignedUpload = {
  key: string;
  signedUrl: string;
  token: string;
};

let resolvedClient: SupabaseClient | null = null;
let resolvedBucket: string | null = null;

function getSupabaseStorage() {
  const config = getStorageConfig();

  if (config.provider !== "supabase") {
    throw new Error(
      "L'upload diretto delle foto richiede STORAGE_PROVIDER=supabase.",
    );
  }

  if (!resolvedClient) {
    resolvedClient = createClient(
      config.url,
      config.secretKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  resolvedBucket = config.bucket;

  return {
    client: resolvedClient,
    bucket: resolvedBucket,
  };
}

export async function createPublicStorageSignedUpload(
  key: string,
): Promise<SignedUpload> {
  const normalizedKey = normalizeStorageKey(key);
  const { client, bucket } = getSupabaseStorage();

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUploadUrl(normalizedKey, {
      upsert: false,
    });

  if (error || !data) {
    throw new Error(
      `Impossibile preparare l'upload diretto su Supabase Storage: ${
        error?.message ?? "risposta vuota"
      }`,
    );
  }

  return {
    key: normalizedKey,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function readPublicStorageObject(
  key: string,
): Promise<Uint8Array> {
  const normalizedKey = normalizeStorageKey(key);
  const { client, bucket } = getSupabaseStorage();

  const { data, error } = await client.storage
    .from(bucket)
    .download(normalizedKey);

  if (error) {
    throw new Error(
      `Impossibile verificare la foto caricata su Supabase Storage: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Supabase Storage non ha restituito la foto caricata.",
    );
  }

  return new Uint8Array(await data.arrayBuffer());
}

export async function deletePublicStorageObject(
  key: string,
): Promise<void> {
  const normalizedKey = normalizeStorageKey(key);
  const { client, bucket } = getSupabaseStorage();

  const { error } = await client.storage
    .from(bucket)
    .remove([normalizedKey]);

  if (error) {
    throw new Error(
      `Impossibile eliminare la foto da Supabase Storage: ${error.message}`,
    );
  }
}

export function getPublicStorageUrl(
  key: string,
): string {
  const normalizedKey = normalizeStorageKey(key);
  const { client, bucket } = getSupabaseStorage();

  return client.storage
    .from(bucket)
    .getPublicUrl(normalizedKey)
    .data.publicUrl;
}

function normalizeStorageKey(
  key: string,
): string {
  const normalizedKey = key
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .trim();

  const segments = normalizedKey.split("/");

  if (
    !normalizedKey ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new Error("Chiave storage non valida.");
  }

  return segments.join("/");
}
