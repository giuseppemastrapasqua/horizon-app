import {
  PrismaAlloggiatiWebCredentialProvider,
} from "./prisma-credential-provider";
import {
  prismaAlloggiatiWebCredentialStore,
} from "./prisma-credential-store";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export function createRuntimeAlloggiatiWebCredentialProvider(
  encryptionKey =
    process.env[ENCRYPTION_KEY_ENV],
) {
  if (!encryptionKey?.trim()) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  return new PrismaAlloggiatiWebCredentialProvider(
    prismaAlloggiatiWebCredentialStore,
    encryptionKey,
  );
}
