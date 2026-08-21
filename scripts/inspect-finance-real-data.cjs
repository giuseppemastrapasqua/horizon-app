const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const properties =
    await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        cleaningCost: true,
        propertyManagementCommissionPercent: true,

        integrationConnections: {
          select: {
            config: true,

            connection: {
              select: {
                connectorKey: true,
              },
            },
          },
        },

        bookings: {
          where: {
            bookingStatus: {
              not: "CANCELLED",
            },
          },

          orderBy: {
            checkIn: "desc",
          },

          take: 3,

          select: {
            id: true,
            guestName: true,
            channel: true,
            grossAmount: true,
            currency: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
    });

  for (const property of properties) {
    console.log("");
    console.log("====================================");
    console.log("STRUTTURA:", property.name);
    console.log(
      "PULIZIE:",
      Number(property.cleaningCost)
    );
    console.log(
      "PM %:",
      Number(
        property.propertyManagementCommissionPercent
      )
    );

    console.log(
      "CONFIG CANALI:",
      JSON.stringify(
        property.integrationConnections,
        null,
        2
      )
    );

    console.log(
      "PRENOTAZIONI:",
      property.bookings.map((booking) => ({
        guest: booking.guestName,
        channel: booking.channel,
        gross: Number(booking.grossAmount),
        currency: booking.currency,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
      }))
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
