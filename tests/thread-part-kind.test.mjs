import assert from "node:assert/strict";
import test from "node:test";
import {
  MIN_KIND_SAMPLE,
  buildRetentionBenchmark,
  classifyThreadPartKind,
} from "../lib/thread-part-kind.ts";

test("a part is a link when nothing but a URL carries meaning", () => {
  assert.equal(classifyThreadPartKind("https://example.com/post"), "link");
  assert.equal(classifyThreadPartKind("👇 https://example.com/post"), "link");
  assert.equal(classifyThreadPartKind("→ https://a.example https://b.example!"), "link");
  // A single stray character is still no note.
  assert.equal(classifyThreadPartKind("a https://example.com"), "link");
});

test("a URL with a note is linkText, and no URL at all is text", () => {
  assert.equal(classifyThreadPartKind("Full write-up: https://example.com"), "linkText");
  assert.equal(classifyThreadPartKind("完整文章 https://example.com"), "linkText");
  assert.equal(classifyThreadPartKind("No link here, just more thoughts."), "text");
  assert.equal(classifyThreadPartKind("example.com without a scheme"), "text");
});

test("retention medians are per kind, and only for kinds with enough threads", () => {
  const part = (text, views, rootViews = 100) => ({ text, views, rootViews });
  const links = Array.from({ length: MIN_KIND_SAMPLE }, (_, i) =>
    part("https://example.com", 10 + i),
  );
  const benchmark = buildRetentionBenchmark([
    ...links,
    part("more thoughts", 40),
    part("and more", 50),
    // A root without views has no retention to measure.
    part("ignored", 30, 0),
  ]);
  assert.deepEqual(benchmark, {
    // Seven retentions: 10, 11, 12, 13, 14, 40, 50.
    median: 13,
    kinds: {
      link: { median: 12, count: MIN_KIND_SAMPLE },
      linkText: { median: null, count: 0 },
      text: { median: null, count: 2 },
    },
  });
  assert.equal(buildRetentionBenchmark([part("x", 1, 3), part("y", 2, 3)]).median, 50);
  assert.equal(buildRetentionBenchmark([]).median, null);
});
