"use server";

import { AuditAction, BookingStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser, requirePropertyRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { emitEvent } from "@/lib/events/emit";

export async function cancelBooking(form: FormData): Promise<void> {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "MANAGER"].includes(user.role)) throw new Error("Operazione non autorizzata.");
  const id = String(form.get("bookingId") ?? "").trim();
  if (!id || form.get("confirmCancellation") !== "yes") throw new Error("Conferma la cancellazione.");
  const target = await prisma.booking.findUnique({ where: { id }, select: { propertyId: true } });
  if (!target) throw new Error("Prenotazione non trovata.");
  await requirePropertyRole(target.propertyId, ["MANAGER"]);
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUniqueOrThrow({ where: { id } });
    if (booking.bookingStatus === BookingStatus.CANCELLED && booking.statusManuallyEdited) return;
    await tx.booking.update({ where: { id }, data: { bookingStatus: BookingStatus.CANCELLED, statusManuallyEdited: true } });
    await AuditService.log({ actorId: user.id, action: AuditAction.UPDATE, propertyId: booking.propertyId,
      entityType: AUDIT_ENTITY_TYPES.BOOKING, entityId: id, description: "Prenotazione cancellata manualmente; storico conservato.",
      metadata: { previousStatus: booking.bookingStatus, newStatus: BookingStatus.CANCELLED } }, tx);
    await emitEvent({ eventType: "BOOKING_CANCELLED", aggregateType: "BOOKING", aggregateId: id,
      payload: { bookingId: id, propertyId: booking.propertyId, ownerId: booking.ownerId,
        guestName: booking.guestName, checkIn: booking.checkIn.toISOString(), checkOut: booking.checkOut.toISOString(), channel: booking.channel },
      idempotencyKey: `BOOKING_CANCELLED:MANUAL:${id}` }, tx);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  for (const path of ["/bookings", `/bookings/${id}`, "/calendar", "/dashboard", "/accounting"]) revalidatePath(path);
  redirect(`/bookings/${id}`);
}
