const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const properties =
    await prisma.property.findMany({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  console.log("STRUTTURE TROVATE:", properties.length);

  for (const property of properties) {
    console.log("");
    console.log("TEST:", property.name);
    console.log("ID:", property.id);

    const formulas =
      await prisma.financeFormula.findMany({
        where: {
          propertyId: property.id,

          status: {
            not: "ARCHIVED",
          },
        },

        select: {
          id: true,
          name: true,
          status: true,
        },
      });

    console.log("FORMULE:", formulas);

    const bookings =
      await prisma.booking.count({
        where: {
          propertyId: property.id,

          bookingStatus: {
            not: "CANCELLED",
          },
        },
      });

    console.log("PRENOTAZIONI:", bookings);

    const owner =
      await prisma.property.findUnique({
        where: {
          id: property.id,
        },

        select: {
          ownerId: true,
        },
      });

    console.log(
      "OWNER:",
      owner?.ownerId ?? null
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
