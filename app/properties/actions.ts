"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createProperty(formData: FormData) {
  const owner = await prisma.user.findFirst({
    where: {
      role: "OWNER",
    },
  });

  if (!owner) {
    throw new Error("Nessun owner trovato. Esegui prima il seed.");
  }

  await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: String(formData.get("name") || ""),
      address: String(formData.get("address") || ""),
      city: String(formData.get("city") || "Milano"),
      zone: String(formData.get("zone") || ""),
      maxGuests: Number(formData.get("maxGuests") || 1),
      bedrooms: Number(formData.get("bedrooms") || 1),
      bathrooms: Number(formData.get("bathrooms") || 1),
      cleaningCost: Number(formData.get("cleaningCost") || 0),
      initialScore: calculateInitialScore({
        zone: String(formData.get("zone") || ""),
        maxGuests: Number(formData.get("maxGuests") || 1),
      }),
      currentScore: calculateInitialScore({
        zone: String(formData.get("zone") || ""),
        maxGuests: Number(formData.get("maxGuests") || 1),
      }),
      notes: String(formData.get("notes") || ""),
      status: "ACTIVE",
    },
  });

  redirect("/properties");
}

function calculateInitialScore({
  zone,
  maxGuests,
}: {
  zone: string;
  maxGuests: number;
}) {
  let score = 70;

  const premiumZones = [
    "brera",
    "duomo",
    "porta nuova",
    "garibaldi",
    "isola",
  ];

  if (premiumZones.includes(zone.toLowerCase())) {
    score += 8;
  }

  if (maxGuests >= 4) {
    score += 4;
  }

  return Math.min(score, 90);
}