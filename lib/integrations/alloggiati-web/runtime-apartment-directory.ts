import {
  AlloggiatiWebApartmentDirectory,
} from "./apartment-directory";
import {
  prismaAlloggiatiAccountStore,
} from "./prisma-account-store";
import {
  SoapPreflightAlloggiatiWebTransport,
} from "./soap-preflight-transport";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export function createRuntimeAlloggiatiWebApartmentDirectory(
  encryptionKey =
    process.env[ENCRYPTION_KEY_ENV],
) {
  if (!encryptionKey?.trim()) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  return new AlloggiatiWebApartmentDirectory(
    prismaAlloggiatiAccountStore,
    new SoapPreflightAlloggiatiWebTransport(),
    encryptionKey,
  );
}