import assert from "node:assert/strict";
import test from "node:test";
import { createLimiter } from "../lib/concurrency.ts";

const tick = () => new Promise((resolve) => setTimeout(resolve, 1));

test("never runs more than the limit at once", async () => {
  const limit = createLimiter(3);
  let active = 0;
  let peak = 0;
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      limit(async () => {
        active++;
        peak = Math.max(peak, active);
        await tick();
        active--;
        return i;
      }),
    ),
  );
  assert.equal(peak, 3);
  assert.deepEqual(
    results,
    Array.from({ length: 20 }, (_, i) => i),
  );
});

test("starts queued tasks in call order", async () => {
  const limit = createLimiter(1);
  const started = [];
  await Promise.all(
    [0, 1, 2, 3].map((i) =>
      limit(async () => {
        started.push(i);
        await tick();
      }),
    ),
  );
  assert.deepEqual(started, [0, 1, 2, 3]);
});

test("frees the slot when a task fails", async () => {
  const limit = createLimiter(1);
  await assert.rejects(
    limit(async () => {
      throw new Error("boom");
    }),
    /boom/,
  );
  assert.equal(await limit(async () => "next"), "next");
});

test("a caller arriving as a slot frees up can't push past the limit", async () => {
  const limit = createLimiter(1);
  let active = 0;
  let peak = 0;
  const run = () =>
    limit(async () => {
      active++;
      peak = Math.max(peak, active);
      await tick();
      active--;
    });
  const first = run();
  const queued = run();
  await first;
  const late = run();
  await Promise.all([queued, late]);
  assert.equal(peak, 1);
});
