import assert from "node:assert/strict";
import net from "node:net";
import test from "node:test";
import {
  fetchInstanceBuildId,
  isOrphaned,
  isPortServing,
  requestShutdown,
  waitForPortFree,
} from "../runtime/server-lifecycle.mjs";

const host = "127.0.0.1";

// Opens a listening server on an ephemeral port and resolves its number.
function listen() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, host, () => resolve({ server, port: server.address().port }));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("isPortServing reports a listening server, then its absence once closed", async () => {
  const { server, port } = await listen();
  try {
    assert.equal(await isPortServing(host, port), true);
  } finally {
    await close(server);
  }
  assert.equal(await isPortServing(host, port), false);
});

test("waitForPortFree returns immediately when the port is already free", async () => {
  // An ephemeral port we bound and released is (almost certainly) free.
  const { server, port } = await listen();
  await close(server);

  const startedAt = Date.now();
  assert.equal(await waitForPortFree(host, port, 2000), true);
  assert.ok(Date.now() - startedAt < 1000, "should not wait out the timeout for a free port");
});

test("waitForPortFree resolves true once a busy port is released within the window", async () => {
  const { server, port } = await listen();
  setTimeout(() => server.close(), 300);

  assert.equal(await waitForPortFree(host, port, 5000), true);
});

test("waitForPortFree returns false when the port stays busy past the timeout", async () => {
  const { server, port } = await listen();
  try {
    assert.equal(await waitForPortFree(host, port, 500), false);
  } finally {
    await close(server);
  }
});

test("fetchInstanceBuildId returns the served build id and null for anything else", async () => {
  const ok = async () => new Response(JSON.stringify({ buildId: "abc123" }), { status: 200 });
  assert.equal(await fetchInstanceBuildId(host, 1, ok), "abc123");

  // An old build without the endpoint answers 404 — that must read as "not
  // the same build", never as a match.
  const notFound = async () => new Response("{}", { status: 404 });
  assert.equal(await fetchInstanceBuildId(host, 1, notFound), null);

  const malformed = async () => new Response(JSON.stringify({ buildId: 42 }), { status: 200 });
  assert.equal(await fetchInstanceBuildId(host, 1, malformed), null);

  const unreachable = async () => {
    throw new Error("ECONNREFUSED");
  };
  assert.equal(await fetchInstanceBuildId(host, 1, unreachable), null);
});

test("requestShutdown reports acknowledgement and sends the guarding header", async () => {
  let seen;
  const ok = async (url, init) => {
    seen = { url, init };
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  assert.equal(await requestShutdown(host, 1, ok), true);
  assert.equal(seen.init.method, "POST");
  assert.equal(seen.init.headers["x-desktop-shutdown"], "1");
  assert.ok(seen.url.endsWith("/api/desktop/shutdown"));

  const refused = async () => new Response("{}", { status: 403 });
  assert.equal(await requestShutdown(host, 1, refused), false);

  const unreachable = async () => {
    throw new Error("ECONNREFUSED");
  };
  assert.equal(await requestShutdown(host, 1, unreachable), false);
});

test("isOrphaned distinguishes a live parent from a reparented one", () => {
  // Parent still alive and unchanged.
  assert.equal(isOrphaned(500, 500), false);
  // Reparented to launchd/init.
  assert.equal(isOrphaned(500, 1), true);
  // Parent PID changed (original shell gone, adopted elsewhere).
  assert.equal(isOrphaned(500, 700), true);
  // Started under init already: reparenting cannot be inferred, never orphaned.
  assert.equal(isOrphaned(1, 1), false);
});
