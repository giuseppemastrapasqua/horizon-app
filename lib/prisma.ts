import { PrismaClient } from "@prisma/client";

type PrismaClientWithSystemEvent = PrismaClient & {
  systemEvent?: unknown;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientWithSystemEvent;
};

const cachedPrisma = globalForPrisma.prisma;

export const prisma: PrismaClient =
  cachedPrisma?.systemEvent
    ? cachedPrisma
    : new PrismaClient({
        log: ["error", "warn"],
      });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}