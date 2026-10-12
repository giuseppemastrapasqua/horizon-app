import assert from "node:assert/strict";
import { password } from "./seed";

export const origin = "http://127.0.0.1:3101";

export class TestClient {
  private cookies = new Map<string, string>();

  async request(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set(
      "cookie",
      [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "),
    );
    const response = await fetch(`${origin}${path}`, {
      ...options,
      headers,
      redirect: "manual",
    });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const index = pair.indexOf("=");
      this.cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
    return response;
  }

  async login(name: string) {
    const csrf = await (await this.request("/api/auth/csrf")).json();
    assert.equal(typeof csrf.csrfToken, "string");
    const response = await this.request("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin },
      body: new URLSearchParams({
        csrfToken: csrf.csrfToken,
        email: `${name.toLowerCase()}@example.com`,
        password,
        callbackUrl: `${origin}/dashboard`,
      }),
    });
    assert.ok(
      [200, 302, 303].includes(response.status),
      `${name}: unexpected login response`,
    );
    const session = await (await this.request("/api/auth/session")).json();
    assert.equal(
      session.user?.id,
      `v1-user-${name}`,
      `${name}: credentials login did not create a session`,
    );
  }
}

export async function expectPage(
  client: TestClient,
  path: string,
  required: string[],
  forbidden: string[],
) {
  const response = await client.request(path);
  assert.equal(response.status, 200, `GET ${path}`);
  const body = await response.text();
  for (const value of required)
    assert.ok(
      body.includes(value),
      `${path}: missing expected marker ${value}`,
    );
  for (const value of forbidden)
    assert.ok(!body.includes(value), `${path}: leaked marker ${value}`);
}

export async function expectStatus(
  client: TestClient,
  path: string,
  statuses: number[],
) {
  const response = await client.request(path);
  assert.ok(
    statuses.includes(response.status),
    `${path}: expected ${statuses}, got ${response.status}`,
  );
  return response;
}
