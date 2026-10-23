"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { accountingSchema } from "@/lib/business-accounting/config";

export async function saveAccounting(year: number, version: number, raw: unknown) {
  const user = await requireRoles(["SUPER_ADMIN"]);
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(version) || version < 0)
    return { ok: false, message: "Anno o versione non validi." };
  const parsed = accountingSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Dati non validi." };
  if (parsed.data.movements.some((m) => !m.date.startsWith(`${year}-`)))
    return { ok: false, message: "La data di ogni movimento deve appartenere all’anno selezionato." };
  try {
    await prisma.$transaction(async (tx) => {
      const config = parsed.data as Prisma.InputJsonValue;
      let id: string;
      if (!version) {
        const created = await tx.businessAccounting.create({ data: { userId: user.id, year, config } });
        id = created.id;
      } else {
        const changed = await tx.businessAccounting.updateMany({ where: { userId: user.id, year, version }, data: { config, version: { increment: 1 } } });
        if (changed.count !== 1) throw new Error("VERSION_CONFLICT");
        const record = await tx.businessAccounting.findUniqueOrThrow({ where: { userId_year: { userId: user.id, year } }, select: { id: true } });
        id = record.id;
      }
      await tx.auditLog.create({ data: { actorId: user.id, action: version ? "UPDATE" : "CREATE", entityType: "BusinessAccounting", entityId: id,
        description: `Contabilità privata ${year} · versione ${version + 1}`,
        metadata: { year, version: version + 1, config } } });
    });
  } catch (error) {
    if ((error instanceof Error && error.message === "VERSION_CONFLICT") || (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"))
      return { ok: false, message: "Dati modificati in un’altra finestra. Ricarica prima di salvare." };
    console.error("Business accounting save failed", error instanceof Error ? error.name : "unknown");
    return { ok: false, message: "Salvataggio non riuscito. Le modifiche rimangono nella pagina." };
  }
  revalidatePath("/business-accounting");
  return { ok: true, version: version + 1, message: "Contabilità salvata." };
}
