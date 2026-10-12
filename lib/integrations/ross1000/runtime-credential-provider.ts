import {
  PrismaRoss1000CredentialProvider,
} from "./prisma-credential-provider";
import {
  prismaRoss1000CredentialStore,
} from "./prisma-credential-store";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export function createRuntimeRoss1000CredentialProvider(
  encryptionKey =
    process.env[ENCRYPTION_KEY_ENV],
) {
  if (!encryptionKey?.trim()) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  return new PrismaRoss1000CredentialProvider(
    prismaRoss1000CredentialStore,
    encryptionKey,
  );
}
