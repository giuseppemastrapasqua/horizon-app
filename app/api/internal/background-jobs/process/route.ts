import { NextResponse } from "next/server";

import { processNextBackgroundJob } from "@/lib/job/process-next-background-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_JOBS_PER_REQUEST = 10;

function getConfiguredSecrets(): string[] {
  return [
    process.env.BACKGROUND_JOB_SECRET,
    process.env.CRON_SECRET,
  ].filter(
    (secret): secret is string =>
      typeof secret === "string" &&
      secret.length > 0,
  );
}

function isAuthorized(
  request: Request,
  configuredSecrets: string[],
): boolean {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return false;
  }

  return configuredSecrets.some(
    (secret) =>
      authorization === `Bearer ${secret}`,
  );
}

async function handleRequest(
  request: Request,
): Promise<NextResponse> {
  const configuredSecrets =
    getConfiguredSecrets();

  if (configuredSecrets.length === 0) {
    return NextResponse.json(
      {
        error:
          "BACKGROUND_JOB_SECRET o CRON_SECRET non è configurato.",
      },
      {
        status: 503,
      },
    );
  }

  if (!isAuthorized(request, configuredSecrets)) {
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
  return handleRequest(request);
}

export async function POST(
  request: Request,
): Promise<NextResponse> {
  return handleRequest(request);
}
