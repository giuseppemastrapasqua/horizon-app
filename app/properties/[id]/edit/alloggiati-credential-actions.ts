"use server";

import { revalidatePath } from "next/cache";

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  encryptCredential,
} from "@/lib/security/credential-crypto";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export async function saveAlloggiatiCredentialsAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = readRequired(
    formData,
    "propertyId",
    "Identificativo immobile mancante.",
  );

  const username = readRequired(
    formData,
    "username",
    "Username Alloggiati Web obbligatorio.",
  );

  const password = readRequired(
    formData,
    "password",
    "Password Alloggiati Web obbligatoria.",
  );

  const wsKey = readRequired(
    formData,
    "wsKey",
    "WSKEY Alloggiati Web obbligatoria.",
  );

  const encryptionKey =
    process.env[ENCRYPTION_KEY_ENV];

  if (!encryptionKey?.trim()) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  await prisma.alloggiatiWebCredential.upsert({
    where: {
      propertyId,
    },
    create: {
      propertyId,
      usernameEncrypted:
        encryptCredential(
          username,
          encryptionKey,
        ),
      passwordEncrypted:
        encryptCredential(
          password,
          encryptionKey,
        ),
      wsKeyEncrypted:
        encryptCredential(
          wsKey,
          encryptionKey,
        ),
      keyVersion: 1,
    },
    update: {
      usernameEncrypted:
        encryptCredential(
          username,
          encryptionKey,
        ),
      passwordEncrypted:
        encryptCredential(
          password,
          encryptionKey,
        ),
      wsKeyEncrypted:
        encryptCredential(
          wsKey,
          encryptionKey,
        ),
      keyVersion: 1,
    },
  });

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}

function readRequired(
  formData: FormData,
  field: string,
  errorMessage: string,
): string {
  const value = String(
    formData.get(field) ?? "",
  ).trim();

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}
