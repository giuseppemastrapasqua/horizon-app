import { parseTriggerDelivery } from "@neon/functions/triggers";

const path = "/api/internal/background-jobs/process";
const previewHost = "horizon-app-git-codex-horizon-v1-20261012-ac1899.vercel.app";

export function createClock({ env = process.env, send = fetch } = {}) {
  return {
    async fetch(request) {
      const route = new URL(request.url).pathname;
      if (route === "/health" && request.method === "GET") {
        return Response.json({ service: "horizon-ical-clock", scope: "preview" });
      }
      if (route !== "/tick" || request.method !== "POST") {
        return new Response("Not found", { status: 404 });
      }
      const delivery = await parseTriggerDelivery(request);
      if (!delivery.ok || delivery.invocation.type !== "schedule" ||
          delivery.invocation.trigger.name !== "horizon-preview-ical") {
        return new Response("Unauthorized trigger", { status: 401 });
      }
      try {
        const origin = new URL(env.HORIZON_WORKER_ORIGIN);
        if (origin.protocol !== "https:" || origin.hostname !== previewHost ||
            origin.username || origin.password || origin.search || origin.hash ||
            origin.port || origin.pathname !== "/" ||
            !env.CRON_SECRET || !env.BACKGROUND_JOB_SECRET) {
          throw new Error("Invalid preview configuration");
        }
        let processed = 0;
        for (let batch = 0; batch < 10; batch++) {
          const response = await send(new URL(path, origin), {
            method: batch === 0 ? "GET" : "POST",
            headers: { authorization: `Bearer ${batch === 0 ? env.CRON_SECRET : env.BACKGROUND_JOB_SECRET}` },
            redirect: "error",
            signal: AbortSignal.timeout(45_000),
          });
          if (!response.ok) throw new Error("Worker request failed");
          const result = await response.json();
          if (!Number.isInteger(result.limit) || result.limit <= 0 ||
              !Number.isInteger(result.processedJobs) || result.processedJobs < 0 ||
              result.processedJobs > result.limit) {
            throw new Error("Invalid worker response");
          }
          processed += result.processedJobs;
          if (result.processedJobs < result.limit) {
            console.log(JSON.stringify({ event: "ical-clock-completed", processed }));
            return Response.json({ processed, drained: true });
          }
        }
        console.warn("iCal clock batch budget reached");
        return Response.json({ processed, drained: false }, { status: 503 });
      } catch {
        console.error("iCal clock request failed; no credentials logged");
        return new Response("Worker unavailable", { status: 502 });
      }
    },
  };
}
