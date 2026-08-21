import { prisma } from "../lib/prisma";

async function main() {
  const properties =
    await prisma.property.findMany({
      where: {
        OR: [
          {
            maxGuests: {
              lte: 0,
            },
          },
          {
            bedrooms: {
              lte: 0,
            },
          },
          {
            bathrooms: {
              lte: 0,
            },
          },
        ],
      },

      select: {
        id: true,
        name: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },
    });

  const comparables =
    await prisma.revenueComparable.findMany({
      where: {
        OR: [
          {
            maxGuests: {
              lte: 0,
            },
          },
          {
            bedrooms: {
              lte: 0,
            },
          },
          {
            bathrooms: {
              lte: 0,
            },
          },
        ],
      },

      select: {
        id: true,
        propertyId: true,
        name: true,
        provider: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
      },
    });

  console.log("");
  console.log(
    "===== INVALID PROPERTY PROFILES =====",
  );

  console.log(properties);

  console.log("");
  console.log(
    "===== INVALID COMPARABLE PROFILES =====",
  );

  console.log(comparables);

  console.log("");
  console.log(
    "===== TOTALS =====",
  );

  console.log({
    properties:
      properties.length,

    comparables:
      comparables.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
