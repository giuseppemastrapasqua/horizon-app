import { NextResponse } from "next/server";

import { processNextBackgroundJob } from "@/lib/job/process-next-background-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JOBS_PER_REQUEST = 10;

function isAuthorized(
  request: Request,
  secret: string | undefined,
): boolean {
  if (!secret) {
    return false;
  }

  const authorization =
    request.headers.get("authorization");

  return authorization === `Bearer ${secret}`;
}

async function handleRequest(
  request: Request,
  secret: string | undefined,
  secretName: "BACKGROUND_JOB_SECRET" | "CRON_SECRET",
): Promise<NextResponse> {
  if (!secret) {
    return NextResponse.json(
      {
        error: `${secretName} non è configurato.`,
      },
      {
        status: 503,
      },
    );
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json(
      {
        error: "Accesso non autorizzato.",
      },
      {
        status: 401,
      },
    );
  }

  try {
    let processedJobs = 0;

    while (
      processedJobs < MAX_JOBS_PER_REQUEST
    ) {
      const processed =
        await processNextBackgroundJob();

      if (!processed) {
        break;
      }

      processedJobs += 1;
    }

    return NextResponse.json({
      processedJobs,
      limit: MAX_JOBS_PER_REQUEST,
      message:
        processedJobs > 0
          ? `${processedJobs} background job elaborati.`
          : "Non ci sono background job disponibili.",
    });
  } catch (error) {
    console.error(
      "Errore durante l'esecuzione del background worker:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Errore durante l'elaborazione dei background job.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(
  request: Request,
): Promise<NextResponse> {
  return handleRequest(
    request,
    process.env.CRON_SECRET,
    "CRON_SECRET",
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  return handleRequest(
    request,
    process.env.BACKGROUND_JOB_SECRET,
    "BACKGROUND_JOB_SECRET",
  );
}
