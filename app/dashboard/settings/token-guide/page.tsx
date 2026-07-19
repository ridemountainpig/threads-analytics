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

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="text-2xl font-semibold">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-10 text-lg font-semibold">{children}</h2>,
  p: ({ children }) => <p className="text-muted-foreground text-sm leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="text-foreground font-medium">{children}</strong>,
  code: ({ children }) => (
    <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{children}</code>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-foreground underline underline-offset-2"
    >
      {children}
    </a>
  ),
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
      loading="lazy"
      className="my-2 w-full rounded-lg border"
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-muted-foreground/30 space-y-2 border-l-2 pl-4">
      {children}
    </blockquote>
  ),
  ul: ({ children }) => (
    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm leading-relaxed">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-muted-foreground list-decimal space-y-1 pl-5 text-sm leading-relaxed">
      {children}
    </ol>
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
      <Link
        href="/dashboard/settings"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
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
