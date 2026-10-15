"use server";

import { revalidatePath } from "next/cache";

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  encryptCredential,
} from "@/lib/security/credential-crypto";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export async function saveRoss1000CredentialsAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = readRequired(
    formData,
    "propertyId",
    "Identificativo immobile mancante.",
  );

  const accountName = readRequired(
    formData,
    "accountName",
    "Nome account ROSS1000 obbligatorio.",
  );

  const structureCode = readRequired(
    formData,
    "structureCode",
    "Codice struttura ROSS1000 obbligatorio.",
  );

  const roomsAvailable = readNonNegativeInteger(
    formData,
    "roomsAvailable",
    "Numero camere/unità disponibili non valido.",
  );

  const bedsAvailable = readNonNegativeInteger(
    formData,
    "bedsAvailable",
    "Numero letti disponibili non valido.",
  );

  const username = readRequired(
    formData,
    "username",
    "Username ROSS1000 obbligatorio.",
  );

  const password = readRequired(
    formData,
    "password",
    "Password ROSS1000 obbligatoria.",
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
        ownerId: true,
        ross1000Property: {
          select: {
            accountId: true,
          },
        },
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  ensureNotLinked(
    property.ross1000Property,
  );

  await prisma.ross1000Account.create({
    data: {
      ownerId: property.ownerId,
      name: accountName,
      usernameEncrypted: encryptCredential(
        username,
        encryptionKey,
      ),
      passwordEncrypted: encryptCredential(
        password,
        encryptionKey,
      ),
      keyVersion: 1,
      properties: {
        create: {
          propertyId,
          structureCode,
          roomsAvailable,
          bedsAvailable,
        },
      },
    },
  });

  revalidateProperty(propertyId);
}

export async function linkExistingRoss1000AccountAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = readRequired(
    formData,
    "propertyId",
    "Identificativo immobile mancante.",
  );

  const accountId = readRequired(
    formData,
    "accountId",
    "Account ROSS1000 obbligatorio.",
  );

  const structureCode = readRequired(
    formData,
    "structureCode",
    "Codice struttura ROSS1000 obbligatorio.",
  );

  const roomsAvailable = readNonNegativeInteger(
    formData,
    "roomsAvailable",
    "Numero camere/unità disponibili non valido.",
  );

  const bedsAvailable = readNonNegativeInteger(
    formData,
    "bedsAvailable",
    "Numero letti disponibili non valido.",
  );

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
        ownerId: true,
        ross1000Property: {
          select: {
            accountId: true,
          },
        },
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  ensureNotLinked(
    property.ross1000Property,
  );

  const account =
    await prisma.ross1000Account.findFirst({
      where: {
        id: accountId,
        ownerId: property.ownerId,
      },
      select: {
        id: true,
      },
    });

  if (!account) {
    throw new Error(
      "Account ROSS1000 non disponibile per questa struttura.",
    );
  }

  await prisma.ross1000Property.create({
    data: {
      propertyId,
      accountId: account.id,
      structureCode,
      roomsAvailable,
      bedsAvailable,
    },
  });

  revalidateProperty(propertyId);
}

function ensureNotLinked(
  connection: {
    accountId: string;
  } | null,
): void {
  if (connection) {
    throw new Error(
      "La struttura è già collegata a un account ROSS1000.",
    );
  }
}

function revalidateProperty(
  propertyId: string,
): void {
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

function readNonNegativeInteger(
  formData: FormData,
  field: string,
  errorMessage: string,
): number {
  const rawValue = String(
    formData.get(field) ?? "",
  ).trim();

  if (!/^\d+$/.test(rawValue)) {
    throw new Error(errorMessage);
  }

  const value = Number(rawValue);

  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new Error(errorMessage);
  }

  return value;
}
