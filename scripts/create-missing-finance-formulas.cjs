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

        financeFormulas: {
          where: {
            status: {
              not: "ARCHIVED",
            },
          },

          select: {
            id: true,
          },
        },
      },
    });

  for (const property of properties) {
    if (
      property.financeFormulas.length > 0
    ) {
      console.log(
        "GIÀ PRESENTE:",
        property.name
      );

      continue;
    }

    const formula =
      await prisma.financeFormula.create({
        data: {
          propertyId:
            property.id,

          name:
            "Ricavo proprietario",

          description:
            "Formula finanziaria standard della struttura.",

          status:
            "DRAFT",

          scope:
            "SINGLE_PROPERTY",

          rules: {
            create: [
              {
                order: 1,
                name:
                  "Cedolare secca",

                description:
                  "Aliquota fiscale applicata al lordo della prenotazione.",

                isEnabled:
                  true,

                operation:
                  "SUBTRACT",

                valueType:
                  "PERCENTAGE",

                value:
                  21,

                base:
                  "GROSS_REVENUE",

                category:
                  "TAX",
              },

              {
                order: 2,
                name:
                  "Varie",

                description:
                  "Eventuali costi o rettifiche aggiuntive.",

                isEnabled:
                  true,

                operation:
                  "SUBTRACT",

                valueType:
                  "FIXED",

                value:
                  0,

                base:
                  "CURRENT_TOTAL",

                category:
                  "OTHER",
              },
            ],
          },
        },

        select: {
          id: true,
          name: true,
        },
      });

    console.log(
      "CREATA:",
      property.name,
      "->",
      formula.id
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
