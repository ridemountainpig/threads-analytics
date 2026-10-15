import { setTimeout as delay } from "node:timers/promises";

const target = process.argv.slice(2).find((argument) => /^https?:\/\//.test(argument));
const baseUrl = new URL(target ?? "http://127.0.0.1:3000");
const requiredLanguages = ["en", "zh-TW", "ja", "x-default"];
const failures = [];

function fail(scope, message) {
  failures.push(`${scope}: ${message}`);
}

function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b[^>]*>`, "gi")) ?? [];
}

function attributes(tag) {
  const result = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = pattern.exec(tag))) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }

  return result;
}

async function request(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer() {
  const healthUrl = new URL("/healthz", baseUrl);

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await request(healthUrl);
      if (response.ok) return;
    } catch {
      // The production server may still be starting.
    }

    await delay(1_000);
  }

  throw new Error(`Server did not become ready at ${healthUrl}`);
}

function localUrl(productionUrl) {
  const parsed = new URL(productionUrl);
  return new URL(`${parsed.pathname}${parsed.search}`, baseUrl);
}

function decodeXml(value) {
  return value.replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");
}

async function checkRouting() {
  const health = await request(new URL("/healthz", baseUrl), { redirect: "manual" });
  if (health.status !== 200) fail("/healthz", `expected 200, received ${health.status}`);
  if (!health.headers.get("cache-control")?.includes("no-store")) {
    fail("/healthz", "must be excluded from caches");
  }

  const unknown = await request(new URL("/__seo-check-missing-page__", baseUrl), {
    redirect: "manual",
  });
  if (unknown.status !== 404) {
    fail("unknown route", `expected a direct 404, received ${unknown.status}`);
  }

  const shared = await request(new URL("/guides", baseUrl), {
    redirect: "manual",
    headers: { "Accept-Language": "zh-TW,zh;q=0.9" },
  });
  if (![307, 308].includes(shared.status)) {
    fail("shared route", `expected a locale redirect, received ${shared.status}`);
  } else if (new URL(shared.headers.get("location"), baseUrl).pathname !== "/zh-TW/guides") {
    fail("shared route", `unexpected redirect target ${shared.headers.get("location")}`);
  }

  const wrongCase = await request(new URL("/zh-tw/guides", baseUrl), { redirect: "manual" });
  if (wrongCase.status !== 308) {
    fail("locale casing", `expected 308, received ${wrongCase.status}`);
  }
}

async function checkPage(productionUrl, internalLinks, titles) {
  const scope = new URL(productionUrl).pathname;
  const response = await request(localUrl(productionUrl));

  if (response.status !== 200) {
    fail(scope, `expected 200, received ${response.status}`);
    return;
  }

  if (!response.headers.get("content-type")?.includes("text/html")) {
    fail(scope, `unexpected content type ${response.headers.get("content-type")}`);
  }

  const html = await response.text();
  if (!/<html\b/i.test(html) || !/<\/html>\s*$/i.test(html)) {
    fail(scope, "response is not a complete HTML document");
  }
  if (html.includes("\u2060")) fail(scope, "contains a U+2060 word joiner");

  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (titleMatches.length !== 1 || !titleMatches[0][1].trim()) {
    fail(scope, `expected one non-empty title, found ${titleMatches.length}`);
  } else {
    const title = titleMatches[0][1].trim();
    if (titles.has(title)) fail(scope, `duplicates the title used by ${titles.get(title)}`);
    titles.set(title, scope);
  }

  const metaTags = tags(html, "meta").map(attributes);
  const description = metaTags.find((tag) => tag.name === "description")?.content;
  if (!description) fail(scope, "missing meta description");

  const linkTags = tags(html, "link").map(attributes);
  const canonical = linkTags.find((tag) => tag.rel === "canonical")?.href;
  if (canonical !== productionUrl) {
    fail(scope, `canonical is ${canonical ?? "missing"}; expected ${productionUrl}`);
  }

  const alternates = new Map(
    linkTags
      .filter((tag) => tag.rel === "alternate" && tag.hreflang)
      .map((tag) => [tag.hreflang, tag.href]),
  );
  for (const language of requiredLanguages) {
    if (!alternates.has(language)) fail(scope, `missing ${language} hreflang`);
  }

  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  if (h1Count !== 1) fail(scope, `expected one H1, found ${h1Count}`);

  const jsonLdPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const jsonLdBlocks = [];
  let scriptMatch;
  while ((scriptMatch = jsonLdPattern.exec(html))) {
    if (attributes(`<script ${scriptMatch[1]}>`).type === "application/ld+json") {
      jsonLdBlocks.push(scriptMatch[2]);
    }
  }
  for (const block of jsonLdBlocks) {
    try {
      JSON.parse(block);
    } catch (error) {
      fail(scope, `invalid JSON-LD: ${error.message}`);
    }
  }

  for (const anchorTag of tags(html, "a")) {
    const href = attributes(anchorTag).href;
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
      continue;
    }

    const resolved = new URL(href, productionUrl);
    if (resolved.origin !== new URL(productionUrl).origin) continue;
    // Cloudflare's email-obfuscation feature injects this link after the
    // origin response; it is infrastructure, not a site-owned destination.
    if (resolved.pathname.startsWith("/cdn-cgi/")) continue;
    resolved.hash = "";
    internalLinks.add(resolved.href);
  }
}

async function checkInternalLinks(internalLinks) {
  for (const productionUrl of internalLinks) {
    const response = await request(localUrl(productionUrl), { redirect: "manual" });
    if (response.status >= 400) {
      fail(new URL(productionUrl).pathname, `internal link returned ${response.status}`);
    }
  }
}

await waitForServer();
await checkRouting();

const sitemapResponse = await request(new URL("/sitemap.xml", baseUrl));
if (!sitemapResponse.ok) throw new Error(`Sitemap returned ${sitemapResponse.status}`);
const sitemapXml = await sitemapResponse.text();
const productionUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
  decodeXml(match[1]),
);

if (productionUrls.length === 0) fail("sitemap", "contains no URLs");
if (new Set(productionUrls).size !== productionUrls.length) fail("sitemap", "contains duplicate URLs");

const internalLinks = new Set();
const titles = new Map();
for (const productionUrl of productionUrls) {
  await checkPage(productionUrl, internalLinks, titles);
}
await checkInternalLinks(internalLinks);

if (failures.length > 0) {
  console.error(`SEO smoke test failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    `SEO smoke test passed: ${productionUrls.length} sitemap pages and ${internalLinks.size} internal links.`,
  );
}
