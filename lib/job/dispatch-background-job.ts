import type {
  BackgroundJob,
  BackgroundJobType,
  Prisma,
} from "@prisma/client";

import { processBookingSyncJob } from "@/lib/job/handlers/process-booking-sync-job";
import { processAlloggiatiWebSubmissionJob } from "@/lib/job/handlers/process-alloggiati-web-submission-job";
import { processPropertyCodeVerificationJob } from "@/lib/job/handlers/process-property-code-verification-job";
import { processPropertyDocumentOcrJob } from "@/lib/job/handlers/process-property-document-ocr-job";
import { processStorageObjectDeleteJob } from "@/lib/job/handlers/process-storage-object-delete-job";
import { processRevenueAiAnalysisJob } from "@/lib/job/handlers/process-revenue-ai-analysis-job";

export type BackgroundJobPayload =
  Prisma.JsonValue;

export type BackgroundJobHandler = (
  job: BackgroundJob,
) => Promise<void>;

function createUnsupportedJobHandler(
  type: BackgroundJobType,
): BackgroundJobHandler {
  return async () => {
    throw new Error(
      `Handler non ancora implementato per il job ${type}.`,
    );
  };
}

const backgroundJobHandlers = {
  PROPERTY_CODE_VERIFICATION:
    processPropertyCodeVerificationJob,

  PROPERTY_DOCUMENT_ANALYSIS:
    createUnsupportedJobHandler(
      "PROPERTY_DOCUMENT_ANALYSIS",
    ),

  PROPERTY_DOCUMENT_OCR:
    processPropertyDocumentOcrJob,

  PROPERTY_DOCUMENT_AI_REVIEW:
    createUnsupportedJobHandler(
      "PROPERTY_DOCUMENT_AI_REVIEW",
    ),

  PROPERTY_SYNC:
    createUnsupportedJobHandler(
      "PROPERTY_SYNC",
    ),

  BOOKING_SYNC:
    processBookingSyncJob,

  ALLOGGIATI_WEB_SUBMISSION:
    processAlloggiatiWebSubmissionJob,

  FINANCE_REPORT_GENERATION:
    createUnsupportedJobHandler(
      "FINANCE_REPORT_GENERATION",
    ),

  REVENUE_AI_ANALYSIS:
    processRevenueAiAnalysisJob,

  STORAGE_OBJECT_DELETE:
    processStorageObjectDeleteJob,
} satisfies Record<
  BackgroundJobType,
  BackgroundJobHandler
>;

export async function dispatchBackgroundJob(
  job: BackgroundJob,
): Promise<void> {
  const handler = backgroundJobHandlers[job.type];

  await handler(job);
}
