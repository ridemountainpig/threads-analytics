import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import proxy from "../proxy.ts";

function request(path, { session } = {}) {
  return new NextRequest(`https://analytics.example${path}`, {
    headers: {
      host: "analytics.example",
      ...(session ? { cookie: `ta_session=${session}` } : {}),
    },
  });
}

/** Whether the proxy let the request through to its route. */
const passes = (response) => response.headers.get("x-middleware-next") === "1";

test("the dashboard sends visitors without a session to the login page", () => {
  const response = proxy(request("/dashboard/posts"));
  assert.equal(response.status, 307);
  const location = new URL(response.headers.get("location"));
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("from"), "/dashboard/posts");
});

test("API routes answer 401 to callers without a session", async () => {
  for (const path of ["/api/posts", "/api/export", "/api/analytics", "/api/status/update"]) {
    const response = proxy(request(path));
    assert.equal(response.status, 401, path);
    assert.deepEqual(await response.json(), { error: "Unauthorized" });
  }
});

test("routes that authenticate their own callers are let through", () => {
  for (const path of [
    "/login",
    "/api/auth/login",
    "/api/cron/sync",
    "/api/oauth/token",
    "/api/oauth/register",
    "/api/mcp",
    "/api/mcp/sse",
  ]) {
    assert.ok(passes(proxy(request(path))), path);
  }
});

test("a path that only starts like a public one is still protected", () => {
  for (const path of ["/api/oauth-admin", "/api/mcpx", "/api/cron/sync-all", "/api/auth/login2"]) {
    assert.equal(proxy(request(path)).status, 401, path);
  }
  assert.equal(proxy(request("/dashboardx")).status, 307);
});

test("pages outside the dashboard are left to themselves", () => {
  // The consent page checks the session itself before granting anything.
  for (const path of ["/", "/oauth/authorize", "/.well-known/oauth-authorization-server"]) {
    assert.ok(passes(proxy(request(path))), path);
  }
});

test("a session cookie lets the request through, to be validated by the route", () => {
  // The proxy only sees the cookie; pages and routes look the session up.
  assert.ok(passes(proxy(request("/dashboard/posts", { session: "anything" }))));
  assert.ok(passes(proxy(request("/api/posts", { session: "anything" }))));
});
