import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown, { defaultUrlTransform, type Components } from "react-markdown";
import { getDictionary } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

const GUIDE_DIR = "token-generate-step";

const guideFiles: Record<Locale, string> = {
  en: "README.md",
  "zh-TW": "README-zh.md",
  ja: "README-ja.md",
};

function transformGuideUrl(url: string) {
  const resolved = url.startsWith("./") ? `/${GUIDE_DIR}/${url.slice(2)}` : url;
  return defaultUrlTransform(resolved);
}

// Long-form reading typography: body copy at full foreground contrast (muted
// is reserved for the note callouts), 15px with relaxed leading, and slight
// negative tracking on the larger headings. Body color is inherited rather
// than set per-element so the callout can quiet everything inside it.
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-semibold tracking-[-0.01em]">{children}</h1>,
  h2: ({ children }) => (
    <h2 className="mt-10 text-lg font-semibold tracking-[-0.01em]">{children}</h2>
  ),
  p: ({ children }) => <p className="text-[15px] leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-tint underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    // Screenshots framed like the app's cards: hairline ring, card radius.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="ring-foreground/10 my-3 w-full rounded-xl ring-1"
    />
  ),
  blockquote: ({ children }) => (
    // Notes render as quiet callout cards (Apple-docs style) instead of a
    // bare left rule; the muted color cascades into the inherited body text.
    <blockquote className="bg-muted/40 text-muted-foreground space-y-2 rounded-xl px-4 py-3">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal space-y-1 pl-5 text-[15px] leading-relaxed">{children}</ol>
  ),
};

export default async function TokenGuidePage() {
  const { locale, t } = await getDictionary();

  const filePath = path.join(process.cwd(), "public", GUIDE_DIR, guideFiles[locale]);
  const raw = await fs.readFile(filePath, "utf-8");
  // Drop the in-file language switcher; the app locale already picks the right version.
  const markdown = raw
    .split("\n")
    .filter((line) => !line.includes("](./README"))
    .join("\n");

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {/* Back link with a real hit area and press feedback — negative margins
          keep it optically aligned with the content column. */}
      <Link
        href="/dashboard/settings"
        className="text-muted-foreground hover:text-foreground hover:bg-muted/70 -mx-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-[background-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        <ArrowLeft className="size-3.5" />
        {t.settingsPage.backToSettings}
      </Link>

      <div className="space-y-4">
        <ReactMarkdown urlTransform={transformGuideUrl} components={markdownComponents}>
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
