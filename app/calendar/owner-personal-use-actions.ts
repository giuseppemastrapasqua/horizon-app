"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requirePropertyAccess, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  assertPersonalUseLimit,
  ownerPersonalUseNote,
  parsePersonalUseDate,
} from "@/lib/owners/personal-use-policy";

export async function reserveOwnerPersonalUse(
  formData: FormData,
): Promise<void> {
  const user = await requireRoles(["OWNER"]);
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  if (!propertyId) throw new Error("Struttura non valida.");
  await requirePropertyAccess(propertyId);
  const start = parsePersonalUseDate(formData.get("startDate"));
  const end = parsePersonalUseDate(formData.get("endDate"));
  const today = new Date().toISOString().slice(0, 10);
  if (start < parsePersonalUseDate(today))
    throw new Error("Il periodo non può iniziare nel passato.");
  assertPersonalUseLimit(start, end, []);
  const nextDay = new Date(end.getTime() + 86400000);
  await prisma.$transaction(
    async (transaction) => {
      const [booked, blocked, personalPeriods] = await Promise.all([
        transaction.booking.findFirst({
          where: {
            propertyId,
            bookingStatus: { not: "CANCELLED" },
            checkIn: { lt: nextDay },
            checkOut: { gt: start },
          },
          select: { id: true },
        }),
        transaction.propertyAvailabilityBlock.findFirst({
          where: {
            propertyId,
            startDate: { lte: end },
            endDate: { gte: start },
          },
          select: { id: true },
        }),
        transaction.propertyAvailabilityBlock.findMany({
          where: {
            propertyId,
            source: "MANUAL",
            note: ownerPersonalUseNote,
            startDate: {
              lt: new Date(Date.UTC(end.getUTCFullYear() + 1, 0, 1)),
            },
            endDate: { gte: new Date(Date.UTC(start.getUTCFullYear(), 0, 1)) },
          },
          select: { startDate: true, endDate: true },
        }),
      ]);
      if (booked || blocked)
        throw new Error(
          "Il periodo contiene giorni già occupati o non disponibili.",
        );
      assertPersonalUseLimit(start, end, personalPeriods);
      await transaction.propertyAvailabilityBlock.create({
        data: {
          propertyId,
          startDate: start,
          endDate: end,
          source: "MANUAL",
          note: ownerPersonalUseNote,
          createdById: user.id,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
  revalidatePath("/calendar");
}

export async function releaseOwnerPersonalUse(
  formData: FormData,
): Promise<void> {
  const user = await requireRoles(["OWNER"]);
  const propertyId = String(formData.get("propertyId") ?? "").trim();
  const blockId = String(formData.get("blockId") ?? "").trim();
  if (!propertyId || !blockId) throw new Error("Periodo non valido.");
  await requirePropertyAccess(propertyId);
  const result = await prisma.propertyAvailabilityBlock.deleteMany({
    where: {
      id: blockId,
      propertyId,
      createdById: user.id,
      source: "MANUAL",
      note: ownerPersonalUseNote,
      startDate: {
        gte: parsePersonalUseDate(new Date().toISOString().slice(0, 10)),
      },
    },
  });
  if (result.count !== 1)
    throw new Error("Il periodo non è modificabile dal tuo account.");
  revalidatePath("/calendar");
}
