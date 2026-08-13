import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

const readline = createInterface({
  input,
  output,
});

async function askRequired(question) {
  while (true) {
    const value = (await readline.question(question)).trim();

    if (value) {
      return value;
    }

    console.log("Questo campo è obbligatorio.");
  }
}

async function main() {
  console.log("");
  console.log("Creazione amministratore Horizon");
  console.log("--------------------------------");
  console.log("");

  const fullName = await askRequired("Nome completo: ");

  const email = (
    await askRequired("Email amministratore: ")
  ).toLowerCase();

  const password = await askRequired(
    "Password temporanea (minimo 8 caratteri): ",
  );

  if (!email.includes("@")) {
    throw new Error("L'indirizzo email non è valido.");
  }

  if (password.length < 8) {
    throw new Error(
      "La password deve contenere almeno 8 caratteri.",
    );
  }

  const passwordHash = await hash(password, 12);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      fullName,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    create: {
      fullName,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log("");
  console.log(
    existingUser
      ? "Amministratore aggiornato correttamente."
      : "Amministratore creato correttamente.",
  );

  console.log("");
  console.log(`Nome: ${admin.fullName}`);
  console.log(`Email: ${admin.email}`);
  console.log(`Ruolo: ${admin.role}`);
  console.log(`Stato: ${admin.status}`);
  console.log("");
  console.log("La password non è stata salvata in chiaro.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("Creazione amministratore non riuscita.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exitCode = 1;
  })
  .finally(async () => {
    readline.close();
    await prisma.$disconnect();
  });