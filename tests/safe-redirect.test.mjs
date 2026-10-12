import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_REDIRECT, sanitizeRedirectPath } from "../lib/safe-redirect.ts";

const ORIGIN = "https://analytics.example";

// Each of these is either off-site already or becomes off-site once a browser
// normalizes it.
const OFF_SITE = [
  "https://evil.example/dashboard",
  "javascript:alert(1)",
  "//evil.example",
  "///evil.example",
  "/\\evil.example",
  "\\\\evil.example",
  "/\t/evil.example", // the URL parser strips tab, CR and LF
  "/\n/evil.example",
  "/\r/evil.example",
  "/\u0000/evil.example",
  "/\u007f/evil.example",
  // Dot segments collapse into a "//host" path once parsed.
  "/.//evil.example",
  "/..//evil.example",
  "/%2e//evil.example",
  "/dashboard/..//evil.example",
  "dashboard/overview",
  "",
];

test("internal paths pass through unchanged", () => {
  for (const path of ["/", "/dashboard/posts", "/dashboard/posts?sort=views&dir=asc#top"]) {
    assert.equal(sanitizeRedirectPath(path), path);
  }
});

test("anything that could leave the site falls back", () => {
  for (const input of OFF_SITE) {
    assert.equal(sanitizeRedirectPath(input), DEFAULT_REDIRECT, JSON.stringify(input));
  }
  assert.equal(sanitizeRedirectPath(null), DEFAULT_REDIRECT);
  assert.equal(sanitizeRedirectPath(undefined), DEFAULT_REDIRECT);
  assert.equal(sanitizeRedirectPath("//evil.example", "/login"), "/login");
});

test("every path it accepts stays on the site once parsed", () => {
  const candidates = [
    ...OFF_SITE,
    "/%2F%2Fevil.example",
    "/%5Cevil.example",
    "/ /evil.example",
    "/\u3000/evil.example",
    "/@evil.example",
    "/dashboard//evil.example",
  ];
  for (const input of candidates) {
    const url = new URL(sanitizeRedirectPath(input), ORIGIN);
    assert.equal(url.origin, ORIGIN, JSON.stringify(input));
    // Nor does its parsed path read as a host when used as a URL again.
    assert.equal(new URL(url.pathname, ORIGIN).origin, ORIGIN, JSON.stringify(input));
  }
});
