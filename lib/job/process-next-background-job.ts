import {
  claimNextBackgroundJob,
} from "@/lib/job/claim-queued-background-job";
import {
  completeBackgroundJob,
} from "@/lib/job/complete-background-job";
import {
  dispatchBackgroundJob,
} from "@/lib/job/dispatch-background-job";
import {
  failBackgroundJob,
} from "@/lib/job/fail-background-job";
import {
  handleFailedBackgroundJob,
} from "@/lib/job/handle-failed-background-job";

export async function processNextBackgroundJob(): Promise<boolean> {
  const job = await claimNextBackgroundJob();

  if (!job) {
    return false;
  }

  try {
    await dispatchBackgroundJob(job);
    await completeBackgroundJob(job.id);
  } catch (error) {
    const failedJob =
      await failBackgroundJob({
        jobId: job.id,
        error,
      });

    try {
      await handleFailedBackgroundJob(
        failedJob,
      );
    } catch (hookError) {
      console.error(
        `Errore durante la gestione del fallimento definitivo del job ${failedJob.id}:`,
        hookError,
      );
    }
  }

  return true;
}