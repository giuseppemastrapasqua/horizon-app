export type LocalStorageConfig = {
  provider: "local";
};

export type SupabaseStorageConfig = {
  provider: "supabase";
  url: string;
  secretKey: string;
  bucket: string;
};

export type StorageConfig =
  | LocalStorageConfig
  | SupabaseStorageConfig;

export function getStorageConfig(
  environment: NodeJS.ProcessEnv = process.env,
): StorageConfig {
  const provider = normalizeProvider(
    environment.STORAGE_PROVIDER,
  );

  if (provider === "local") {
    return {
      provider: "local",
    };
  }

  return {
    provider: "supabase",
    url: requireEnvironmentValue(
      environment.SUPABASE_URL,
      "SUPABASE_URL",
    ),
    secretKey: requireEnvironmentValue(
      environment.SUPABASE_SECRET_KEY,
      "SUPABASE_SECRET_KEY",
    ),
    bucket: requireEnvironmentValue(
      environment.SUPABASE_STORAGE_BUCKET,
      "SUPABASE_STORAGE_BUCKET",
    ),
  };
}

function normalizeProvider(
  value: string | undefined,
): StorageConfig["provider"] {
  const normalizedValue =
    value?.trim().toLowerCase() || "local";

  if (
    normalizedValue !== "local" &&
    normalizedValue !== "supabase"
  ) {
    throw new Error(
      `STORAGE_PROVIDER non supportato: ${normalizedValue}.`,
    );
  }

  return normalizedValue;
}

function requireEnvironmentValue(
  value: string | undefined,
  name: string,
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `${name} è obbligatoria quando STORAGE_PROVIDER è impostato su supabase.`,
    );
  }

  return normalizedValue;
}