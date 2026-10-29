export const protectedPropertyRelations = {
  bookings: "Prenotazioni",
  documents: "Documenti",
  financeFormulas: "Formule economiche",
  financeReports: "Rendiconti proprietari",
  tasks: "Attività operative",
  revenueMarketSnapshots: "Analisi di mercato",
  revenueDailySignals: "Segnali Revenue",
  revenueRecommendations: "Raccomandazioni Revenue",
} as const;

export type PropertyDeletionCounts = Record<keyof typeof protectedPropertyRelations, number>;
export const propertyDeletionCountSelect = {
  bookings: true, documents: true, financeFormulas: true, financeReports: true,
  tasks: true, revenueMarketSnapshots: true, revenueDailySignals: true, revenueRecommendations: true,
} as const;

export function propertyDeletionBlockers(counts: PropertyDeletionCounts) {
  return (Object.keys(protectedPropertyRelations) as (keyof PropertyDeletionCounts)[])
    .filter((key) => counts[key] > 0)
    .map((key) => ({ key, label: protectedPropertyRelations[key], count: counts[key] }));
}

export class PropertyDeletionError extends Error {}

export function assertPropertyCanBeDeleted(property: { status: string; _count: PropertyDeletionCounts }) {
  if (property.status !== "ARCHIVED") throw new PropertyDeletionError("Archivia prima la struttura per poterla eliminare definitivamente.");
  const blockers = propertyDeletionBlockers(property._count);
  if (blockers.length) throw new PropertyDeletionError(`Eliminazione definitiva bloccata: ${blockers.map((b) => `${b.label}: ${b.count}`).join(" · ")}. Mantieni la struttura archiviata per conservare lo storico.`);
}
