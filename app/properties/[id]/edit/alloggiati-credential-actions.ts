"use server";

import { revalidatePath } from "next/cache";

import { requireRoles } from "@/lib/auth/guards";
import {
  createRuntimeAlloggiatiWebApartmentDirectory,
} from "@/lib/integrations/alloggiati-web/runtime-apartment-directory";
import {
  discoverAlloggiatiApartments,
} from "@/lib/integrations/alloggiati-web/apartment-discovery";
import { prisma } from "@/lib/prisma";
import {
  encryptCredential,
} from "@/lib/security/credential-crypto";

const ENCRYPTION_KEY_ENV =
  "HORIZON_CREDENTIAL_ENCRYPTION_KEY";

export type AlloggiatiApartmentOption = {
  apartmentId: string;
  description: string;
};

export async function discoverAlloggiatiApartmentsAction(
  formData: FormData,
): Promise<AlloggiatiApartmentOption[]> {
  await requireRoles(["SUPER_ADMIN"]);

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

  return discoverAlloggiatiApartments({
    username,
    password,
    wsKey,
  });
}
export async function listAlloggiatiApartmentsAction(
  propertyId: string,
  accountId: string,
): Promise<AlloggiatiApartmentOption[]> {
  await requireRoles(["SUPER_ADMIN"]);

  const normalizedPropertyId =
    propertyId.trim();

  const normalizedAccountId =
    accountId.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!normalizedAccountId) {
    throw new Error(
      "Account Alloggiati Web obbligatorio.",
    );
  }

  const property =
    await prisma.property.findUnique({
      where: {
        id: normalizedPropertyId,
      },
      select: {
        ownerId: true,
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  const directory =
    createRuntimeAlloggiatiWebApartmentDirectory();

  return directory.listApartments(
    normalizedAccountId,
    property.ownerId,
  );
}

export async function saveAlloggiatiCredentialsAction(
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
    "Nome account Alloggiati Web obbligatorio.",
  );

  const apartmentId =
    readApartmentId(formData);

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
        ownerId: true,
        alloggiatiWebProperty: {
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
    property.alloggiatiWebProperty,
  );

  await prisma.alloggiatiWebAccount.create({
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
      wsKeyEncrypted: encryptCredential(
        wsKey,
        encryptionKey,
      ),
      keyVersion: 1,
      properties: {
        create: {
          propertyId,
          apartmentId,
        },
      },
    },
  });

  revalidateProperty(propertyId);
}

export async function linkExistingAlloggiatiAccountAction(
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
    "Account Alloggiati Web obbligatorio.",
  );

  const apartmentId =
    readApartmentId(formData);

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
        ownerId: true,
        alloggiatiWebProperty: {
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
    property.alloggiatiWebProperty,
  );

  const account =
    await prisma.alloggiatiWebAccount.findFirst({
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
      "Account Alloggiati Web non disponibile per questa struttura.",
    );
  }

  await prisma.alloggiatiWebProperty.create({
    data: {
      propertyId,
      accountId: account.id,
      apartmentId,
    },
  });

  revalidateProperty(propertyId);
}

function readApartmentId(
  formData: FormData,
): string {
  const apartmentId = readRequired(
    formData,
    "apartmentId",
    "IdAppartamento Alloggiati Web obbligatorio.",
  );

  if (!/^\d+$/.test(apartmentId)) {
    throw new Error(
      "IdAppartamento Alloggiati Web non valido.",
    );
  }

  return apartmentId;
}

function ensureNotLinked(
  connection: {
    accountId: string;
  } | null,
): void {
  if (connection) {
    throw new Error(
      "La struttura è già collegata a un account Alloggiati Web.",
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