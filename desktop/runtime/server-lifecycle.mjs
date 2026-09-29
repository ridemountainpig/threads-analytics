import net from "node:net";

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resolves true when something is already accepting connections on the port.
export function isPortServing(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const settle = (serving) => {
      socket.destroy();
      resolve(serving);
    };
    socket.setTimeout(1000);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

// Resolves true once the port stops accepting connections within the window.
export async function waitForPortFree(host, port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await isPortServing(host, port))) return true;
    await delay(200);
  }
  return !(await isPortServing(host, port));
}

// The build id of the sidecar currently serving the port, or null when it
// cannot say (an old build without the endpoint, or not our server at all) —
// null callers must treat as "not the same build".
export async function fetchInstanceBuildId(host, port, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`http://${host}:${port}/api/desktop/instance`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.buildId === "string" ? data.buildId : null;
  } catch {
    return null;
  }
}

// Asks the sidecar on the port to exit so this launch can take over. Resolves
// true when the instance acknowledged; old builds without the endpoint (or a
// foreign server) resolve false and the caller falls back to waiting.
export async function requestShutdown(host, port, fetchImpl = fetch) {
  try {
    const response = await fetchImpl(`http://${host}:${port}/api/desktop/shutdown`, {
      method: "POST",
      headers: { "x-desktop-shutdown": "1" },
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Whether a sidecar has been orphaned: its Zig shell died, so the process was
// reparented and its parent PID no longer matches the one observed at startup
// (reparenting to launchd/init is just the common case of this change). A
// process that started under init (parentAtStart === 1) has no live parent to
// lose, so reparenting cannot be inferred and it is never treated as orphaned.
export function isOrphaned(parentAtStart, currentPpid) {
  return parentAtStart !== 1 && currentPpid !== parentAtStart;
}

// A sidecar whose Zig shell died gets reparented to launchd/init (ppid 1).
// Self-terminate so an orphan stops holding the port for the next launch.
export function watchParentExit() {
  const parentAtStart = process.ppid;
  const timer = setInterval(() => {
    if (isOrphaned(parentAtStart, process.ppid)) {
      console.info("[desktop] parent process exited; shutting down the server sidecar");
      process.exit(0);
    }
  }, 1000);
  timer.unref();
}
