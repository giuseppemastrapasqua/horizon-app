"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePropertyRole, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { activationSchema } from "@/lib/activation/config";

export type SaveActivationState = { ok: boolean; message: string; version?: number };
export async function saveActivation(id: string, expectedVersion: number, raw: unknown): Promise<SaveActivationState> {
  const user = await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  await requirePropertyRole(id, ["MANAGER"]);
  if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return { ok: false, message: "Versione non valida." };
  const parsed = activationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Configurazione non valida." };
  const property = await prisma.property.findUnique({ where: { id }, select: { maxGuests: true } });
  if (!property || parsed.data.baseGuests > property.maxGuests) return { ok: false, message: "Verifica la capienza e gli ospiti inclusi." };
  const config = parsed.data as Prisma.InputJsonValue;
  try {
    await prisma.$transaction(async (tx) => {
      if (expectedVersion === 0) await tx.propertyActivation.create({ data: { propertyId: id, config } });
      else {
        const updated = await tx.propertyActivation.updateMany({ where: { propertyId: id, version: expectedVersion }, data: { config, version: { increment: 1 } } });
        if (updated.count !== 1) throw new Error("VERSION_CONFLICT");
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: expectedVersion ? "UPDATE" : "CREATE", entityType: "PropertyActivation", entityId: id, propertyId: id,
        description: `Configurazione attivazione e lancio · versione ${expectedVersion + 1}`,
        metadata: { version: expectedVersion + 1, config } } });
    });
  } catch (cause) {
    if ((cause instanceof Error && cause.message === "VERSION_CONFLICT") || (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002")) return { ok: false, message: "La scheda è stata modificata altrove. Ricarica la pagina prima di salvare." };
    console.error("Activation save failed", cause instanceof Error ? cause.name : "unknown");
    return { ok: false, message: "Salvataggio non riuscito. Le modifiche rimangono nella pagina: riprova." };
  }
  revalidatePath("/activation");
  revalidatePath(`/activation/${id}`);
  return { ok: true, version: expectedVersion + 1, message: "Configurazione salvata. Nessuna tariffa inviata ai portali." };
}
