import assert from "node:assert/strict";
import test from "node:test";
import { hourLabeler } from "../lib/hour-label.ts";

test("hour labels follow each locale's clock", () => {
  const en = hourLabeler("en-US");
  assert.deepEqual(
    [0, 9, 12, 21, 23].map((hour) => en(hour)),
    ["12 AM", "9 AM", "12 PM", "9 PM", "11 PM"],
  );
  const ja = hourLabeler("ja-JP");
  assert.deepEqual(
    [0, 9, 21].map((hour) => ja(hour)),
    ["0時", "9時", "21時"],
  );
  assert.equal(hourLabeler("zh-TW")(21), "下午9時");
});

test("hour labels use plain spaces so server and browser markup match", () => {
  for (const hour of [0, 9, 21]) {
    assert.doesNotMatch(hourLabeler("en-US")(hour), /[   ]/);
  }
});
