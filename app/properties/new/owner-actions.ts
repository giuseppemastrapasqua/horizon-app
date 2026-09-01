"use server";

import {
  RecordStatus,
  UserRole,
} from "@prisma/client";

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function createOwnerQuickAction(input: {
  fullName: string;
  email: string;
}) {
  await requireRoles([
    "SUPER_ADMIN",
    "MANAGER",
  ]);

  const fullName = input.fullName.trim();
  const email = input.email
    .trim()
    .toLowerCase();

  if (!fullName) {
    throw new Error(
      "Il nome del proprietario è obbligatorio.",
    );
  }

  if (
    !email ||
    !email.includes("@")
  ) {
    throw new Error(
      "Inserisci un indirizzo email valido.",
    );
  }

  const existing =
    await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

  if (existing) {
    if (existing.role !== UserRole.OWNER) {
      throw new Error(
        "Questa email è già associata a un altro utente.",
      );
    }

    return {
      id: existing.id,
      fullName: existing.fullName,
      email: existing.email,
    };
  }

  return prisma.user.create({
    data: {
      fullName,
      email,
      role: UserRole.OWNER,
      status: RecordStatus.ACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });
}
