import assert from "node:assert/strict";
import test from "node:test";
import { dateLocales, dictionaries, isLocale, localeNames, locales } from "../lib/i18n.ts";

/** Every translated value in a dictionary, as [dotted.key, value]. */
function entries(node, prefix = "") {
  return Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? entries(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value]],
  );
}

const placeholders = (value) => [...String(value).matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

const english = new Map(entries(dictionaries.en));

// Singular forms only English inflects for; the components fall back to the
// plural string when a locale leaves them out.
const ENGLISH_ONLY = new Set(["postsPage.threadsCountOne"]);

test("every locale has a dictionary, a name and a date locale", () => {
  assert.deepEqual(Object.keys(dictionaries).sort(), [...locales].sort());
  for (const locale of locales) {
    assert.ok(isLocale(locale), locale);
    assert.ok(localeNames[locale], locale);
    assert.ok(dateLocales[locale], locale);
  }
  assert.equal(isLocale("fr"), false);
  assert.equal(isLocale(undefined), false);
});

test("every locale translates the same keys as English", () => {
  for (const locale of locales) {
    const keys = new Set(entries(dictionaries[locale]).map(([key]) => key));
    const missing = [...english.keys()].filter((key) => !keys.has(key) && !ENGLISH_ONLY.has(key));
    const extra = [...keys].filter((key) => !english.has(key));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] }, locale);
  }
});

test("translations keep the placeholders the code fills in", () => {
  for (const locale of locales) {
    for (const [key, value] of entries(dictionaries[locale])) {
      const expected = english.get(key);
      if (Array.isArray(expected)) {
        assert.equal(value.length, expected.length, `${locale} ${key}`);
        continue;
      }
      assert.deepEqual(
        placeholders(value).sort(),
        placeholders(expected).sort(),
        `${locale} ${key}: ${value}`,
      );
    }
  }
});

test("a placeholder appears at most once in a string", () => {
  // Components fill placeholders with String#replace, which only replaces the
  // first occurrence, so a repeated one would show up as a literal "{count}".
  for (const locale of locales) {
    for (const [key, value] of entries(dictionaries[locale])) {
      const found = placeholders(value);
      assert.equal(new Set(found).size, found.length, `${locale} ${key}: ${value}`);
    }
  }
});
