import { runBackgroundJobWorker } from "@/lib/job/run-background-job-worker";
import { prisma } from "@/lib/prisma";

let shutdownRequested = false;

function requestShutdown(signal: string): void {
  if (shutdownRequested) {
    return;
  }

  shutdownRequested = true;

  console.log(
    `\nRicevuto ${signal}. Arresto del worker in corso...`,
  );
}

process.on("SIGINT", () => {
  requestShutdown("SIGINT");
});

process.on("SIGTERM", () => {
  requestShutdown("SIGTERM");
});

console.log("Background job worker avviato.");

runBackgroundJobWorker({
  isShutdownRequested: () => shutdownRequested,

  onError: (error) => {
    console.error(
      "Errore non gestito nel ciclo del worker:",
      error,
    );
  },
})
  .catch((error) => {
    console.error(
      "Errore fatale del background job worker:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();

    console.log("Background job worker arrestato.");
  });