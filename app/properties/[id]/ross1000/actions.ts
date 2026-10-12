"use server";

import { revalidatePath } from "next/cache";
import { requirePropertyRole, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { PublicAlloggiatiReferenceProvider } from "@/lib/integrations/alloggiati-web/public-reference-provider";
import { prepareRoss1000Transmission } from "@/lib/integrations/ross1000/prepare-transmission";
import { parsePersonalUseDate } from "@/lib/owners/personal-use-policy";

async function authorize(form: FormData) {
  await requireRoles(["SUPER_ADMIN", "MANAGER"]);
  const propertyId = String(form.get("propertyId") ?? "").trim();
  if (!propertyId) throw new Error("Struttura non valida.");
  await requirePropertyRole(propertyId, ["MANAGER"]);
  return propertyId;
}

export async function prepareRoss1000Action(form: FormData): Promise<void> {
  const propertyId = await authorize(form);
  const date = parsePersonalUseDate(form.get("movementDate"));
  if (date > parsePersonalUseDate(new Date().toISOString().slice(0, 10)))
    throw new Error("Non puoi preparare movimenti futuri.");
  const resolver = await new PublicAlloggiatiReferenceProvider().getResolver();
  await prepareRoss1000Transmission(propertyId, date, resolver);
  revalidatePath(`/properties/${propertyId}/ross1000`);
}

export async function sendRoss1000Action(form: FormData): Promise<void> {
  const propertyId = await authorize(form);
  if (process.env.HORIZON_ROSS1000_SEND_ENABLED !== "true")
    throw new Error("Invio ROSS1000 non abilitato.");
  const id = String(form.get("transmissionId") ?? "").trim();
  const transmission = await prisma.ross1000Transmission.findFirst({
    where: { id, propertyId, status: "PREPARED" },
    select: { id: true, movementDate: true },
  });
  if (!transmission)
    throw new Error("Trasmissione non disponibile per l'invio.");
  if (
    transmission.movementDate >
    parsePersonalUseDate(new Date().toISOString().slice(0, 10))
  )
    throw new Error("Non puoi inviare movimenti futuri.");
  const unresolved = await prisma.ross1000Transmission.findFirst({
    where: {
      propertyId,
      movementDate: transmission.movementDate,
      id: { not: transmission.id },
      status: { in: ["SENDING", "OUTCOME_UNKNOWN", "CONFIRMED"] },
    },
    select: { id: true },
  });
  if (unresolved)
    throw new Error(
      "Esiste già un invio per questo giorno: verifica l'esito prima di procedere.",
    );
  await enqueueBackgroundJob({
    type: "ROSS1000_SUBMISSION",
    payload: { transmissionId: transmission.id, propertyId },
    deduplicationKey: `ROSS1000_SEND:${transmission.id}`,
  });
  revalidatePath(`/properties/${propertyId}/ross1000`);
}
