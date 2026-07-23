"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createTask(formData: FormData) {
  const propertyId = String(formData.get("propertyId") || "");
  const bookingIdRaw = String(formData.get("bookingId") || "");
  const ownerIdRaw = String(formData.get("ownerId") || "");
  const dueDateRaw = String(formData.get("dueDate") || "");

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { owner: true },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  await prisma.task.create({
    data: {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      type: String(formData.get("type") || "ADMIN") as any,
      status: "TODO",
      dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      propertyId: property.id,
      bookingId: bookingIdRaw || null,
      ownerId: ownerIdRaw || property.ownerId,
    },
  });

  redirect(`/properties/${property.id}`);
}