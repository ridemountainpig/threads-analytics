import Image from "next/image";
import Link from "next/link";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps, ReactNode } from "react";
import { guideImages, type GuideImage } from "@/lib/guides";
import type { Locale } from "@/lib/locales";

// Elements and components available to the MDX bodies in content/. They
// render the same markup and classes as the .article-body styles expect.

function Callout({ children }: { children: ReactNode }) {
  return <aside className="article-callout">{children}</aside>;
}

/** Wraps a markdown table with a caption. `text` tables wrap and align left
 * instead of the right-aligned figures of a data table. */
function Table({
  caption,
  variant = "data",
  children,
}: {
  caption?: string;
  variant?: "data" | "text";
  children: ReactNode;
}) {
  return (
    <figure className={variant === "text" ? "article-table article-table-text" : "article-table"}>
      <div className="article-table-scroll">{children}</div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

/** Dashboard screenshot from public/guides/, rendered with demo data. */
function Figure({ image, alt, caption }: { image: GuideImage; alt: string; caption: string }) {
  const { src, width, height } = guideImages[image];
  return (
    <figure className="article-figure">
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        sizes="(max-width: 780px) 100vw, 760px"
      />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function mdxArticleComponents(locale: Locale): MDXComponents {
  // Hrefs starting with "/" are site paths without the locale segment, so the
  // same link works in every translation. "/#deploy" is an anchor on the home
  // page, which lives at /<locale> without a trailing slash.
  function ArticleLink({ href = "", children, ...props }: ComponentProps<"a">) {
    if (href.startsWith("/")) {
      const path = href.startsWith("/#") ? href.slice(1) : href;
      return (
        <Link href={`/${locale}${path}`} {...props}>
          {children}
        </Link>
      );
    }
    if (href.startsWith("#")) {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  return { a: ArticleLink, Callout, Figure, Table };
}
