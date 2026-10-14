import { test } from "node:test";
import assert from "node:assert/strict";
import { createClock } from "./clock.mjs";
const env = {
  HORIZON_WORKER_ORIGIN: "https://horizon-app-git-codex-horizon-v1-20261012-ac1899.vercel.app",
  CRON_SECRET: "test-cron", BACKGROUND_JOB_SECRET: "test-worker",
};
function tick({ header = "test-invocation", name = "horizon-preview-ical", id = "test-invocation" } = {}) {
  return new Request("https://clock.example/tick", {
    method: "POST", headers: header ? { "x-neon-trigger-invocation-id": header } : {},
    body: JSON.stringify({ version: 1, invocation_id: id, trigger: { type: "schedule", id: "test-trigger", name }, data: { scheduled_at: "2026-10-14T10:00:00Z" } }),
  });
}
test("rejects forged or unrelated trigger deliveries without calling the worker", async () => {
  let calls = 0;
  const clock = createClock({ env, send: async () => { calls++; } });
  for (const request of [tick({ header: "" }), tick({ id: "different" }), tick({ name: "unrelated" })]) {
    assert.equal((await clock.fetch(request)).status, 401);
  }
  assert.equal(calls, 0);
});
test("GET schedules once, then POST drains the remaining batches", async () => {
  const calls = [];
  const clock = createClock({ env, send: async (url, options) => {
    calls.push({ url: url.href, ...options });
    return Response.json({ limit: 10, processedJobs: calls.length === 1 ? 10 : 2 });
  } });
  const response = await clock.fetch(tick());
  assert.deepEqual(await response.json(), { processed: 12, drained: true });
  assert.deepEqual(calls.map(c => c.method), ["GET", "POST"]);
  assert.deepEqual(calls.map(c => c.headers.authorization), ["Bearer test-cron", "Bearer test-worker"]);
  assert.ok(calls.every(c => c.redirect === "error" && c.signal));
});
test("refuses production destinations and missing credentials", async () => {
  for (const bad of [{ HORIZON_WORKER_ORIGIN: "https://horizongest.it" }, { CRON_SECRET: "" }]) {
    let calls = 0;
    const response = await createClock({ env: { ...env, ...bad }, send: async () => { calls++; } }).fetch(tick());
    assert.equal(response.status, 502);
    assert.equal(calls, 0);
  }
});
test("stops on invalid or failed responses without echoing downstream secrets", async () => {
  for (const result of [new Response("secret details", { status: 401 }), Response.json({ processedJobs: -1, limit: 10 })]) {
    const response = await createClock({ env, send: async () => result }).fetch(tick());
    assert.equal(response.status, 502);
    assert.equal(await response.text(), "Worker unavailable");
  }
});
test("limits execution to ten batches", async () => {
  let calls = 0;
  const response = await createClock({ env, send: async () => { calls++; return Response.json({ limit: 10, processedJobs: 10 }); } }).fetch(tick());
  assert.equal(calls, 10);
  assert.equal(response.status, 503);
});
