const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

console.log("systemEvent presente:", Boolean(prisma.systemEvent));
console.log(
  "delegate trovati:",
  Object.keys(prisma).filter((key) =>
    key.toLowerCase().includes("system")
  )
);

prisma
  .$disconnect()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });