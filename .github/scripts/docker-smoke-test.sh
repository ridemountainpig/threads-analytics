#!/usr/bin/env bash
# Boots a built dashboard image next to a fresh PostgreSQL on a Docker network
# without internet access, then checks that it migrates, serves, talks to the
# database, and ships nothing it should not. Run it locally after
# `docker build -t threads-analytics .`:
#
#   bash .github/scripts/docker-smoke-test.sh threads-analytics
#
# MAX_APP_MB caps the size of /app inside the image (the base image is not
# counted). Raise it deliberately when a dependency legitimately grows.
set -euo pipefail

image="${1:?usage: docker-smoke-test.sh <image>}"
max_app_mb="${MAX_APP_MB:-400}"
run_id="ta-smoke-$$"
network="$run_id-net"
database="$run_id-db"
app="$run_id-app"
password="smoke-test-password"

cleanup() {
  docker rm -f "$app" "$database" > /dev/null 2>&1 || true
  docker network rm "$network" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# Read the logs in full before matching them: with pipefail, `docker logs |
# grep -q` fails whenever grep exits on its match before docker has written
# the lines after it (SIGPIPE), so a server that did start could read as not
# ready.
server_ready() {
  local logs
  logs="$(docker logs "$app" 2>&1)" || return 1
  grep -q "Ready in" <<< "$logs"
}

fail() {
  echo "::error::$1"
  echo "----- app logs -----"
  docker logs "$app" 2>&1 | tail -60 || true
  exit 1
}

echo "== Image contents"
# Secrets, the desktop-only SQLite stack and build-only toolchains must never
# reach the web image; the runtime is Next's standalone output plus the
# Prisma CLI for startup migrations.
forbidden="$(docker run --rm --entrypoint sh "$image" -c '
  find /app -maxdepth 1 -name ".env*"
  ls -d /app/desktop /app/website 2>/dev/null
  ls /app/node_modules/.pnpm 2>/dev/null | grep -E "^(better-sqlite3@|@prisma\+adapter-better-sqlite3@|@native-sdk\+|@next\+swc-|typescript@|shadcn@)" || true
')"
if [[ -n "$forbidden" ]]; then
  fail "the image contains files it should not ship:
$forbidden"
fi
app_mb="$(docker run --rm --entrypoint sh "$image" -c 'du -sm /app | cut -f1')"
echo "/app is ${app_mb} MB (limit ${max_app_mb} MB)"
if (( app_mb > max_app_mb )); then
  fail "/app is ${app_mb} MB, over the ${max_app_mb} MB limit; check what the runner stage copies"
fi
migration_count="$(docker run --rm --entrypoint sh "$image" -c 'ls -d /app/prisma/migrations/*/ | wc -l' | tr -d ' ')"

echo "== Booting against PostgreSQL on an internal network"
# --internal gives the containers no route out, so anything the image tries
# to download at startup (such as a Prisma engine) fails here, not in prod.
docker network create --internal "$network" > /dev/null
docker run -d --name "$database" --network "$network" \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=threads_analytics postgres:16 > /dev/null
for _ in $(seq 1 60); do
  docker exec "$database" pg_isready -U postgres -d threads_analytics > /dev/null 2>&1 && break
  sleep 1
done
docker exec "$database" pg_isready -U postgres -d threads_analytics > /dev/null || fail "PostgreSQL did not become ready"

docker run -d --name "$app" --network "$network" \
  -e DATABASE_URL="postgresql://postgres:postgres@$database:5432/threads_analytics" \
  -e APP_PASSWORD="$password" \
  -e TOKEN_ENCRYPTION_KEY="$(printf '0%.0s' $(seq 1 64))" \
  -e SYNC_SCHEDULER_ENABLED=true \
  "$image" > /dev/null

for _ in $(seq 1 120); do
  server_ready && break
  [[ "$(docker inspect -f '{{.State.Running}}' "$app")" == "true" ]] || fail "the container exited during startup"
  sleep 1
done
server_ready || fail "the server did not report ready within 120s"

applied="$(docker exec "$database" psql -U postgres -d threads_analytics -tAc \
  'select count(*) from _prisma_migrations where finished_at is not null and rolled_back_at is null')"
echo "migrations applied: $applied of $migration_count"
[[ "$applied" == "$migration_count" ]] || fail "expected $migration_count applied migrations, found $applied"

echo "== HTTP checks"
# Runs inside the app container with its own Node, so it needs no extra image
# and reaches the server on the hostname Next binds to.
docker exec -i -e SMOKE_PASSWORD="$password" "$app" node --input-type=module - <<'NODE' || fail "HTTP checks failed"
import { hostname } from "node:os";

const base = `http://${hostname()}:3000`;
let failed = false;
const check = (ok, label) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}`);
  if (!ok) failed = true;
};

const anonymous = await fetch(`${base}/dashboard/overview`, { redirect: "manual" });
check(
  anonymous.status >= 300 && anonymous.status < 400 &&
    (anonymous.headers.get("location") ?? "").includes("/login"),
  `GET /dashboard/overview without a session redirects to /login (${anonymous.status})`,
);

// Login writes a session row, so this also proves the bundled Prisma client
// reaches the database.
const login = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ password: process.env.SMOKE_PASSWORD }),
});
const cookie = (login.headers.get("set-cookie") ?? "").split(";")[0];
check(login.status === 200 && cookie.length > 0, `POST /api/auth/login (${login.status})`);

const pages = [
  "/api/status",
  "/dashboard/overview",
  "/dashboard/posts",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/settings/token-guide",
];
for (const path of pages) {
  const response = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  check(response.status === 200, `GET ${path} (${response.status})`);
}

const assets = [
  ["/threads-analytics-icon.png", "image/png"],
  ["/token-generate-step/step-1.png", "image/png"],
  ["/_next/image?url=%2Fthreads-analytics-icon.png&w=64&q=75", "image/"],
];
for (const [path, type] of assets) {
  const response = await fetch(`${base}${path}`);
  const contentType = response.headers.get("content-type") ?? "";
  check(response.status === 200 && contentType.startsWith(type), `GET ${path} (${response.status} ${contentType})`);
}

const mcp = await fetch(`${base}/api/mcp`, {
  method: "POST",
  headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
});
check(mcp.status === 401, `POST /api/mcp without a token is rejected (${mcp.status})`);

process.exit(failed ? 1 : 0);
NODE

echo "== Server logs"
# Missing modules or files only surface when a route first loads them.
if docker logs "$app" 2>&1 | grep -E "Cannot find module|MODULE_NOT_FOUND|ENOENT|⨯"; then
  fail "the server logged errors while serving the checks above"
fi
echo "no module or file errors"

echo "Smoke test passed for $image"
