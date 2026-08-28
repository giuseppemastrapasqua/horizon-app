import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const processNextBackgroundJobMock = vi.hoisted(() =>
  vi.fn(),
);

vi.mock(
  "@/lib/job/process-next-background-job",
  () => ({
    processNextBackgroundJob:
      processNextBackgroundJobMock,
  }),
);

import { GET, POST } from "./route";

describe("POST /api/internal/background-jobs/process", () => {
  const originalBackgroundJobSecret =
    process.env.BACKGROUND_JOB_SECRET;

  const originalCronSecret =
    process.env.CRON_SECRET;

  beforeEach(() => {
    processNextBackgroundJobMock.mockReset();

    delete process.env.BACKGROUND_JOB_SECRET;
    delete process.env.CRON_SECRET;
  });

  afterEach(() => {
    restoreEnvironmentVariable(
      "BACKGROUND_JOB_SECRET",
      originalBackgroundJobSecret,
    );

    restoreEnvironmentVariable(
      "CRON_SECRET",
      originalCronSecret,
    );

    vi.restoreAllMocks();
  });

  it("restituisce 503 quando non è configurato alcun secret", async () => {
    const response = await POST(
      createRequest(),
    );

    expect(response.status).toBe(503);

    await expect(response.json()).resolves.toEqual({
      error:
        "BACKGROUND_JOB_SECRET o CRON_SECRET non è configurato.",
    });

    expect(
      processNextBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("restituisce 401 quando manca il bearer token", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    const response = await POST(
      createRequest(),
    );

    expect(response.status).toBe(401);

    await expect(response.json()).resolves.toEqual({
      error: "Accesso non autorizzato.",
    });

    expect(
      processNextBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("restituisce 401 quando il bearer token non è valido", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    const response = await POST(
      createRequest("wrong-secret"),
    );

    expect(response.status).toBe(401);

    await expect(response.json()).resolves.toEqual({
      error: "Accesso non autorizzato.",
    });

    expect(
      processNextBackgroundJobMock,
    ).not.toHaveBeenCalled();
  });

  it("accetta BACKGROUND_JOB_SECRET", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    processNextBackgroundJobMock.mockResolvedValueOnce(
      false,
    );

    const response = await POST(
      createRequest("background-secret"),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      processedJobs: 0,
      limit: 10,
      message:
        "Non ci sono background job disponibili.",
    });
  });

  it("accetta CRON_SECRET", async () => {
    process.env.CRON_SECRET = "cron-secret";

    processNextBackgroundJobMock.mockResolvedValueOnce(
      false,
    );

    const response = await POST(
      createRequest("cron-secret"),
    );

    expect(response.status).toBe(200);

    expect(
      processNextBackgroundJobMock,
    ).toHaveBeenCalledOnce();
  });

  it("elabora i job finché la coda non è vuota", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    processNextBackgroundJobMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const response = await POST(
      createRequest("background-secret"),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      processedJobs: 3,
      limit: 10,
      message: "3 background job elaborati.",
    });

    expect(
      processNextBackgroundJobMock,
    ).toHaveBeenCalledTimes(4);
  });

  it("non elabora più di dieci job per richiesta", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    processNextBackgroundJobMock.mockResolvedValue(
      true,
    );

    const response = await POST(
      createRequest("background-secret"),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      processedJobs: 10,
      limit: 10,
      message: "10 background job elaborati.",
    });

    expect(
      processNextBackgroundJobMock,
    ).toHaveBeenCalledTimes(10);
  });

  it("restituisce 500 quando il processor genera un errore", async () => {
    process.env.BACKGROUND_JOB_SECRET =
      "background-secret";

    const processorError = new Error(
      "Processor non disponibile.",
    );

    processNextBackgroundJobMock.mockRejectedValueOnce(
      processorError,
    );

    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const response = await POST(
      createRequest("background-secret"),
    );

    expect(response.status).toBe(500);

    await expect(response.json()).resolves.toEqual({
      error:
        "Errore durante l'elaborazione dei background job.",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Errore durante l'esecuzione del background worker:",
      processorError,
    );
  });
  it("accetta GET con CRON_SECRET", async () => {
    process.env.CRON_SECRET = "cron-secret";

    processNextBackgroundJobMock.mockResolvedValueOnce(
      false,
    );

    const request = createRequest("cron-secret");

    const response = await GET(
      new Request(request.url, {
        method: "GET",
        headers: request.headers,
      }),
    );

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      processedJobs: 0,
      limit: 10,
      message:
        "Non ci sono background job disponibili.",
    });

    expect(
      processNextBackgroundJobMock,
    ).toHaveBeenCalledOnce();
  });
});

function createRequest(
  bearerToken?: string,
): Request {
  const headers = new Headers();

  if (bearerToken) {
    headers.set(
      "authorization",
      `Bearer ${bearerToken}`,
    );
  }

  return new Request(
    "http://localhost/api/internal/background-jobs/process",
    {
      method: "POST",
      headers,
    },
  );
}

function restoreEnvironmentVariable(
  name: "BACKGROUND_JOB_SECRET" | "CRON_SECRET",
  value: string | undefined,
): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}