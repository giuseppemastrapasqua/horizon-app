const {
  PrismaClient,
} = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_LIMIT = 20;

function getLimit() {
  const rawLimit = process.argv[2];

  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const parsedLimit = Number.parseInt(
    rawLimit,
    10,
  );

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit <= 0
  ) {
    throw new Error(
      "Il limite deve essere un numero intero maggiore di zero.",
    );
  }

  return parsedLimit;
}

async function main() {
  const limit = getLimit();

  const jobs =
    await prisma.backgroundJob.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

  if (jobs.length === 0) {
    console.log(
      "Nessun background job presente.",
    );

    return;
  }

  console.log(
    `Ultimi ${jobs.length} background job:`,
  );

  console.dir(jobs, {
    depth: null,
    colors: true,
  });
}

main()
  .catch((error) => {
    console.error(
      "Errore durante la lettura dei background job:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });