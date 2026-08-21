import { prisma } from "../lib/prisma";

async function main() {
  const properties =
    await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,

        revenueComparables: {
          orderBy: {
            similarityScore: "desc",
          },

          take: 10,

          select: {
            name: true,
            provider: true,
            maxGuests: true,
            bedrooms: true,
            bathrooms: true,
            adr: true,
            nightlyPrice: true,
            similarityScore: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

  console.log("");
  console.log(
    "===== COMPARABLE PROFILE CHECK =====",
  );

  for (
    const property of
      properties
  ) {
    console.log("");
    console.log(
      "========================================",
    );

    console.log({
      property:
        property.name,

      maxGuests:
        property.maxGuests,

      bedrooms:
        property.bedrooms,

      bathrooms:
        property.bathrooms,
    });

    for (
      const comparable of
        property.revenueComparables
    ) {
      console.log({
        comparable:
          comparable.name,

        maxGuests:
          comparable.maxGuests,

        bedrooms:
          comparable.bedrooms,

        bathrooms:
          comparable.bathrooms,

        adr:
          comparable.adr === null
            ? null
            : Number(
                comparable.adr,
              ),

        similarity:
          comparable.similarityScore ===
          null
            ? null
            : Number(
                comparable.similarityScore,
              ),
      });
    }
  }
}

main()
  .catch(
    (error) => {
      console.error(
        error,
      );

      process.exitCode =
        1;
    },
  )
  .finally(
    async () => {
      await prisma.$disconnect();
    },
  );
