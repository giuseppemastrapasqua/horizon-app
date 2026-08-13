import type { IntegrationProvider } from "./types";

export const SYNCHRONIZATION_STATUSES = {
  SUCCESS: "SUCCESS",
  PARTIAL_SUCCESS: "PARTIAL_SUCCESS",
  FAILED: "FAILED",
} as const;

export type SynchronizationStatus =
  (typeof SYNCHRONIZATION_STATUSES)[keyof typeof SYNCHRONIZATION_STATUSES];

export type SynchronizationReport = {
  provider: IntegrationProvider;

  status: SynchronizationStatus;

  startedAt: Date;
  completedAt: Date;

  durationMs: number;

  processedPages: number;

  fetchedBookings: number;

  importedBookings: number;

  updatedBookings: number;

  skippedBookings: number;

  failedBookings: number;

  warnings: string[];

  errors: string[];
};

export function createSuccessfulSynchronizationReport(input: {
  provider: IntegrationProvider;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  processedPages: number;
  fetchedBookings: number;
}): SynchronizationReport {
  return {
    provider: input.provider,

    status: SYNCHRONIZATION_STATUSES.SUCCESS,

    startedAt: input.startedAt,
    completedAt: input.completedAt,

    durationMs: input.durationMs,

    processedPages: input.processedPages,

    fetchedBookings: input.fetchedBookings,

    importedBookings: 0,
    updatedBookings: 0,
    skippedBookings: 0,
    failedBookings: 0,

    warnings: [],
    errors: [],
  };
}