import { verifyPersonalUse } from "./personal-use";
import { hash } from "bcryptjs";
import { verifyTransmissionConcurrency } from "./transmission-concurrency";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import {
  assertIsolatedDatabase,
  seedIsolatedData,
  propertyA,
  propertyB,
  users,
} from "./seed";
import { TestClient, expectPage, expectStatus } from "./http-client";

async function main() {
  assertIsolatedDatabase();
  const prisma = new PrismaClient();
  let server: ReturnType<typeof spawn> | undefined;
  const checks: string[] = [];
  const privateAlpha = [
    "PRIVATE_GUEST_ALPHA",
    "private.alpha@example.com",
    "PRIVATE_BOOKING_NOTE_ALPHA",
  ];
  const beta = [
    "V1_PROPERTY_BETA_CANARY",
    "PRIVATE_GUEST_BETA",
    "V1_REPORT_BETA",
    "V1_MAINTENANCE_BETA",
  ];
  try {
    await seedIsolatedData(prisma);
    await verifyTransmissionConcurrency(prisma);
    checks.push(
      "PostgreSQL serializable transmission claims prevent duplicate, unknown and confirmed re-sends",
    );
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3101",
      ],
      {
        env: {
          ...process.env,
          AUTH_TRUST_HOST: "true",
          NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3101",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let ready = false;
    server.stdout?.on("data", (data: Buffer) => {
      if (data.toString().includes("Ready")) ready = true;
    });
    server.stderr?.on("data", (data: Buffer) => process.stderr.write(data));
    for (let attempt = 0; attempt < 150 && !ready; attempt++) {
      if (server.exitCode !== null)
        throw new Error("Local Next.js server exited before readiness.");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, "Local server readiness timed out.");
    const clients = new Map<string, TestClient>();
    for (const name of Object.keys(users)) {
      const client = new TestClient();
      await client.login(name);
      clients.set(name, client);
      checks.push(`login ${name}`);
    }
    const a = clients.get("ownerA")!;
    for (const path of [
      "/dashboard",
      "/calendar",
      "/bookings",
      "/performance",
    ]) {
      await expectPage(
        a,
        path,
        ["V1_PROPERTY_ALPHA_CANARY"],
        [...privateAlpha, ...beta],
      );
      checks.push(`owner scope ${path}`);
    }
    await expectPage(
      a,
      "/bookings/v1-booking-alpha",
      ["V1_PROPERTY_ALPHA_CANARY"],
      [...privateAlpha, ...beta],
    );
    await expectStatus(a, "/bookings/v1-booking-beta", [404]);
    await expectPage(
      a,
      "/tasks",
      ["V1_MAINTENANCE_ALPHA"],
      ["V1_CLEANING_ALPHA", "PRIVATE_TASK_DESCRIPTION_ALPHA", ...beta],
    );
    await expectPage(
      a,
      "/documents",
      ["V1_REPORT_ALPHA"],
      ["V1_DRAFT_ALPHA", ...beta],
    );
    const foreignCalendar = await expectStatus(a, `/calendar?propertyId=${propertyB}`, [404]);
    const foreignCalendarBody = await foreignCalendar.text();
    for (const marker of beta) assert.ok(!foreignCalendarBody.includes(marker));
    await expectPage(a, `/bookings?propertyId=${propertyB}`, [], beta);
    await expectPage(a, `/performance?propertyId=${propertyB}`, [], beta);
    checks.push(
      "owner task/document minimization and foreign property filters",
    );
    const search = await (
      await expectStatus(a, "/api/search?q=V1", [200])
    ).text();
    assert.ok(search.includes("V1_PROPERTY_ALPHA_CANARY"));
    for (const marker of [
      ...beta,
      ...privateAlpha,
      "V1_DRAFT_ALPHA",
      "V1_CLEANING_ALPHA",
    ])
      assert.ok(!search.includes(marker));
    const privateSearch = await (
      await expectStatus(a, "/api/search?q=PRIVATE_GUEST", [200])
    ).json();
    assert.deepEqual(privateSearch.results, []);
    checks.push(
      "owner search does not expose foreign, guest, cleaning or draft records",
    );
    await expectPage(
      clients.get("ownerB")!,
      "/dashboard",
      ["V1_PROPERTY_BETA_CANARY"],
      ["V1_PROPERTY_ALPHA_CANARY", "PRIVATE_GUEST_BETA"],
    );
    await expectStatus(clients.get("ownerB")!, "/bookings/v1-booking-alpha", [
      404,
    ]);
    for (const name of ["ownerA", "ownerB", "operator"]) {
      const client = clients.get(name)!;
      await expectStatus(client, "/api/finance/formulas", [403]);
      const write = await client.request("/api/finance/formulas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      assert.equal(write.status, 403);
      checks.push(`formula read/write denied ${name}`);
    }
    for (const name of ["manager", "finance"]) {
      const client = clients.get(name)!;
      const formulas = await (
        await expectStatus(client, "/api/finance/formulas", [200])
      ).text();
      assert.ok(formulas.includes("V1_FORMULA_ALPHA"));
      assert.ok(!formulas.includes("V1_FORMULA_BETA"));
      checks.push(`finance scope ${name}`);
    }
    await expectStatus(a, "/invoices/v1-draft-alpha/pdf", [404]);
    await expectStatus(a, "/reports/monthly/v1-report-beta/pdf", [403, 404]);
    await expectStatus(
      clients.get("operator")!,
      "/reports/monthly/v1-report-alpha/pdf",
      [403],
    );
    const pdf = await expectStatus(a, "/reports/monthly/v1-report-alpha/pdf", [
      200,
    ]);
    assert.ok(pdf.headers.get("content-type")?.includes("application/pdf"));
    assert.ok(
      Buffer.from(await pdf.arrayBuffer())
        .subarray(0, 4)
        .equals(Buffer.from("%PDF")),
    );
    checks.push("PDF authorization and own report rendering");
    await verifyPersonalUse(prisma, a, clients.get("operator")!);
    checks.push(
      "native owner forms enforce concurrency, property scope, booking conflicts, annual quota and release",
    );
    await prisma.propertyAccess.update({
      where: {
        propertyId_userId: { propertyId: propertyA, userId: "v1-user-manager" },
      },
      data: { active: false },
    });
    const revoked = await (
      await expectStatus(clients.get("manager")!, "/api/finance/formulas", [
        200,
      ])
    ).text();
    assert.ok(!revoked.includes("V1_FORMULA_ALPHA"));
    checks.push("property access revocation affects an existing session");
    await prisma.user.update({
      where: { id: "v1-user-admin" },
      data: { role: "OWNER" },
    });
    await expectStatus(clients.get("admin")!, "/api/finance/formulas", [403]);
    checks.push("role demotion affects an existing session");
    await prisma.user.update({
      where: { id: "v1-user-ownerB" },
      data: { passwordHash: await hash("Rotated-Isolated-Password-Only!", 10) },
    });
    const resetSession = await (
      await clients.get("ownerB")!.request("/api/auth/session")
    ).json();
    assert.ok(!resetSession?.user?.id);
    checks.push("password reset revokes an existing authenticated session");
    await prisma.user.update({
      where: { id: "v1-user-ownerA" },
      data: { status: "INACTIVE" },
    });
    const session = await (await a.request("/api/auth/session")).json();
    assert.ok(!session?.user?.id);
    await expectStatus(a, "/api/finance/formulas", [401]);
    checks.push("disabled user loses existing session access");
    console.log(
      JSON.stringify(
        { isolatedDatabase: "horizon_v1_test", passed: checks.length, checks },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(JSON.stringify({ completedChecks: checks }));
    throw error;
  } finally {
    server?.kill("SIGTERM");
    const forceStop = setTimeout(() => server?.kill("SIGKILL"), 1000);
    forceStop.unref();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
