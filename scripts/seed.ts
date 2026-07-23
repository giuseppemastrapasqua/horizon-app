import {
  PrismaClient,
  UserRole,
  RecordStatus,
  PropertyStatus,
  PropertyCommercialClass,
  PropertyVictoryModel,
  BookingChannel,
  BookingStatus,
  BookingOperationalStatus,
  TaskType,
  TaskStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.task.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const owner = await prisma.user.create({
    data: {
      fullName: "Giuseppe Demo",
      email: "giuseppe@horizon-demo.it",
      phone: "+39 333 000 0000",
      role: UserRole.OWNER,
      status: RecordStatus.ACTIVE,
    },
  });

  const property1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Brera Design Apartment",
      address: "Via Solferino 12",
      city: "Milano",
      zone: "Brera",
      maxGuests: 4,
      bedrooms: 1,
      bathrooms: 1,
      status: PropertyStatus.ACTIVE,
      commercialClass: PropertyCommercialClass.PREMIUM_PERFORMER,
      victoryModel: PropertyVictoryModel.ADR_WINNER,
      initialScore: 82,
      currentScore: 86,
      notes: "Appartamento demo ad alto potenziale in zona Brera.",
    },
  });

  const property2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Navigli Urban Loft",
      address: "Ripa di Porta Ticinese 45",
      city: "Milano",
      zone: "Navigli",
      maxGuests: 2,
      bedrooms: 1,
      bathrooms: 1,
      status: PropertyStatus.ACTIVE,
      commercialClass: PropertyCommercialClass.SOLID_PERFORMER,
      victoryModel: PropertyVictoryModel.BALANCED_WINNER,
      initialScore: 74,
      currentScore: 78,
      notes: "Loft demo pensato per soggiorni brevi e coppie.",
    },
  });

  const booking1 = await prisma.booking.create({
    data: {
      propertyId: property1.id,
      ownerId: owner.id,
      channel: BookingChannel.AIRBNB,
      guestName: "Laura Bianchi",
      guestEmail: "laura@example.com",
      guestPhone: "+39 320 111 2222",
      checkIn: new Date("2026-07-10"),
      checkOut: new Date("2026-07-14"),
      nights: 4,
      guests: 2,
      grossAmount: 1280.0,
      currency: "EUR",
      bookingStatus: BookingStatus.CONFIRMED,
      operationalStatus: BookingOperationalStatus.OK,
      internalNotes: "Check-in autonomo da inviare 48h prima.",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      propertyId: property1.id,
      ownerId: owner.id,
      channel: BookingChannel.BOOKING,
      guestName: "Marco Rossi",
      guestEmail: "marco@example.com",
      guestPhone: "+39 327 333 4444",
      checkIn: new Date("2026-07-18"),
      checkOut: new Date("2026-07-21"),
      nights: 3,
      guests: 3,
      grossAmount: 990.0,
      currency: "EUR",
      bookingStatus: BookingStatus.CONFIRMED,
      operationalStatus: BookingOperationalStatus.DOCUMENTS_PENDING,
      internalNotes: "Manca documento del secondo ospite.",
    },
  });

  const booking3 = await prisma.booking.create({
    data: {
      propertyId: property2.id,
      ownerId: owner.id,
      channel: BookingChannel.DIRECT,
      guestName: "Anna Verdi",
      guestEmail: "anna@example.com",
      guestPhone: "+39 329 555 6666",
      checkIn: new Date("2026-07-22"),
      checkOut: new Date("2026-07-26"),
      nights: 4,
      guests: 2,
      grossAmount: 860.0,
      currency: "EUR",
      bookingStatus: BookingStatus.CONFIRMED,
      operationalStatus: BookingOperationalStatus.CLEANING_PENDING,
      internalNotes: "Verificare disponibilità early check-in.",
    },
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Pulizia pre check-in Brera",
        description:
          "Pulizia completa e controllo welcome kit prima dell'arrivo ospite.",
        type: TaskType.CLEANING,
        status: TaskStatus.TODO,
        dueDate: new Date("2026-07-09T12:00:00"),
        propertyId: property1.id,
        bookingId: booking1.id,
        ownerId: owner.id,
      },
      {
        title: "Recupero documento ospite Booking",
        description: "Contattare l'ospite e recuperare il documento mancante.",
        type: TaskType.GUEST_DOCUMENTS,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date("2026-07-17T18:00:00"),
        propertyId: property1.id,
        bookingId: booking2.id,
        ownerId: owner.id,
      },
      {
        title: "Coordinare pulizia Navigli Urban Loft",
        description: "Confermare slot cleaning prima del check-in diretto.",
        type: TaskType.CLEANING,
        status: TaskStatus.TODO,
        dueDate: new Date("2026-07-21T11:00:00"),
        propertyId: property2.id,
        bookingId: booking3.id,
        ownerId: owner.id,
      },
      {
        title: "Verifica scarico bagno Navigli",
        description: "Piccola manutenzione segnalata dal soggiorno precedente.",
        type: TaskType.MAINTENANCE,
        status: TaskStatus.TODO,
        dueDate: new Date("2026-07-23T10:00:00"),
        propertyId: property2.id,
        ownerId: owner.id,
      },
    ],
  });

  console.log("Seed Horizon completato.");
  console.log(`Owner creato: ${owner.fullName}`);
  console.log("Property create: 2");
  console.log("Booking create: 3");
  console.log("Task create: 4");
}

main()
  .catch((e) => {
    console.error("Errore seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });