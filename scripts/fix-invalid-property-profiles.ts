import { prisma } from "../lib/prisma";

async function main() {
  console.log("");
  console.log(
    "===== FIX INVALID PROFILES =====",
  );

  const properties =
    await prisma.property.findMany({
      where: {
        OR: [
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
        bedrooms: true,
        bathrooms: true,
      },
    });

  const comparables =
    await prisma.revenueComparable.findMany({
      where: {
        OR: [
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
        bedrooms: true,
        bathrooms: true,
      },
    });

  console.log("");
  console.log("BEFORE");
  console.log({
    properties,
    comparables,
  });

  const propertyResult =
    await prisma.property.updateMany({
      where: {
        OR: [
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

      data: {
        bedrooms: null,
        bathrooms: null,
      },
    });

  const comparableResult =
    await prisma.revenueComparable.updateMany({
      where: {
        OR: [
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

      data: {
        bedrooms: null,
        bathrooms: null,
      },
    });

  console.log("");
  console.log("UPDATED");
  console.log({
    properties:
      propertyResult.count,

    comparables:
      comparableResult.count,
  });

  const remainingProperties =
    await prisma.property.count({
      where: {
        OR: [
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
    });

  const remainingComparables =
    await prisma.revenueComparable.count({
      where: {
        OR: [
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
    });

  console.log("");
  console.log(
    "===== AFTER =====",
  );

  console.log({
    invalidProperties:
      remainingProperties,

    invalidComparables:
      remainingComparables,
  });

  if (
    remainingProperties !== 0 ||
    remainingComparables !== 0
  ) {
    throw new Error(
      "Sono rimasti profili invalidi.",
    );
  }

  console.log("");
  console.log(
    "PROFILE CLEANUP OK",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
