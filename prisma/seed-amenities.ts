import { PrismaClient } from "@prisma/client";

import {
  PROPERTY_AMENITIES,
  PROPERTY_AMENITY_CATEGORY_LABELS,
} from "../lib/properties/property-amenities";

const prisma = new PrismaClient();

async function seedAmenities(): Promise<void> {
  const result = await prisma.amenity.createMany({
    data: PROPERTY_AMENITIES.map((amenity, index) => ({
      key: amenity.key,
      label: amenity.label,
      category: amenity.category,
      description: PROPERTY_AMENITY_CATEGORY_LABELS[amenity.category],
      isActive: true,
      sortOrder: index,
    })),
    skipDuplicates: true,
  });

  const totalAmenities = await prisma.amenity.count();

  console.log(
    `Catalogo servizi inizializzato: ${result.count} nuovi servizi, ${totalAmenities} totali.`,
  );
}

seedAmenities()
  .catch((error: unknown) => {
    console.error("Errore durante l'inizializzazione dei servizi:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });