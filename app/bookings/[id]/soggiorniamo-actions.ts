"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import {
  requirePropertyRole,
  requireUser,
} from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import {
  persistManualFiscalDecision,
  type ManualFiscalDecisionRepository,
} from "@/lib/integrations/soggiorniamo/manual-fiscal-decision-service";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export type ApplyManualSoggiorniamoFiscalDecisionInput = {
  bookingGuestId: string;
  guestTypeCode: number;
  intermediary?: string | null;
  tariff?: number;
  taxAmount?: number;
};

const SUPPORTED_MANUAL_GUEST_TYPE_CODES = new Set([1, 9, 14]);

export async function applyManualSoggiorniamoFiscalDecisionAction(
  input: ApplyManualSoggiorniamoFiscalDecisionInput,
) {
  const user = await requireUser();

  if (
    typeof input.bookingGuestId !== "string" ||
    input.bookingGuestId.trim().length === 0
  ) {
    throw new Error("Ospite non valido.");
  }

  if (
    !Number.isInteger(input.guestTypeCode) ||
    !SUPPORTED_MANUAL_GUEST_TYPE_CODES.has(input.guestTypeCode)
  ) {
    throw new Error("Categoria Soggiorniamo non supportata.");
  }

  const bookingGuest = await prisma.bookingGuest.findUnique({
    where: {
      id: input.bookingGuestId,
    },
    select: {
      id: true,
      booking: {
        select: {
          id: true,
          propertyId: true,
          checkIn: true,
          checkOut: true,
        },
      },
    },
  });

  if (!bookingGuest) {
    throw new Error("Ospite prenotazione non trovato.");
  }

  await requirePropertyRole(
    bookingGuest.booking.propertyId,
    ["OWNER", "MANAGER"],
  );

  const repository: ManualFiscalDecisionRepository = {
    async upsert(repositoryInput) {
      await prisma.soggiorniamoFiscalClassification.upsert(
        repositoryInput,
      );
    },
  };

  const decision = await persistManualFiscalDecision(
    {
      bookingGuestId: bookingGuest.id,
      checkIn: bookingGuest.booking.checkIn,
      checkOut: bookingGuest.booking.checkOut,
      guestTypeCode: input.guestTypeCode,
      intermediary: input.intermediary?.trim() || null,

      // Per il codice 1 tariffa e imposta vengono
      // sempre calcolate server-side dalla policy Milano.
      tariff:
        input.guestTypeCode === 1
          ? undefined
          : input.tariff,

      taxAmount:
        input.guestTypeCode === 1
          ? undefined
          : input.taxAmount,
    },
    repository,
  );

  await AuditService.log({
    actorId: user.id,
    action: AuditAction.UPDATE,
    propertyId: bookingGuest.booking.propertyId,
    entityType: AUDIT_ENTITY_TYPES.BOOKING,
    entityId: bookingGuest.booking.id,
    description:
      "Classificazione fiscale Soggiorniamo aggiornata manualmente.",
    metadata: {
      soggiorniamoFiscalDecision: true,
      bookingGuestId: bookingGuest.id,
      guestTypeCode: decision.guestTypeCode,
      tariff: decision.tariff,
      taxAmount: decision.taxAmount,
      intermediary: decision.intermediary,
      source: decision.source,
      status: decision.status,
      reason: decision.reason,
    },
  });

  revalidatePath(`/bookings/${bookingGuest.booking.id}`);

  return {
    success: true as const,
    decision,
  };
}
