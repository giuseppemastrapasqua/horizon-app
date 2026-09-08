export type LocalPrivateStorageConfig = {
  provider: "local";
  rootDirectory?: string;
};

export type SupabasePrivateStorageConfig = {
  provider: "supabase";
  url: string;
  secretKey: string;
  bucket: string;
};

export type PrivateStorageConfig =
  | LocalPrivateStorageConfig
  | SupabasePrivateStorageConfig;

export function getPrivateStorageConfig(
  environment: NodeJS.ProcessEnv = process.env,
): PrivateStorageConfig {
  const provider = normalizeProvider(
    environment.PRIVATE_STORAGE_PROVIDER ??
      environment.STORAGE_PROVIDER,
  );

  if (provider === "local") {
    const rootDirectory =
      environment.HORIZON_PRIVATE_STORAGE_DIR?.trim();

    return {
      provider: "local",
      ...(rootDirectory ? { rootDirectory } : {}),
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
      environment.SUPABASE_PRIVATE_STORAGE_BUCKET,
      "SUPABASE_PRIVATE_STORAGE_BUCKET",
    ),
  };
}

function normalizeProvider(
  value: string | undefined,
): PrivateStorageConfig["provider"] {
  const normalizedValue =
    value?.trim().toLowerCase() || "local";

  if (
    normalizedValue !== "local" &&
    normalizedValue !== "supabase"
  ) {
    throw new Error(
      `PRIVATE_STORAGE_PROVIDER non supportato: ${normalizedValue}.`,
    );
  }

  return normalizedValue as PrivateStorageConfig["provider"];
}

function requireEnvironmentValue(
  value: string | undefined,
  name: string,
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `${name} e obbligatoria quando lo storage privato e impostato su supabase.`,
    );
  }

  return normalizedValue;
}
