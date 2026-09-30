import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/locales";
import { siteConfig } from "@/lib/site";

const announcementUrl =
  "https://about.fb.com/news/2025/03/new-threads-features-more-personalized-experience-you-control/";

const sourceCopy: Record<
  Locale,
  {
    title: string;
    officialTitle: string;
    officialMeta: string;
    officialNote: string;
    methodTitle: string;
    methodMeta: string;
    methodNote: string;
  }
> = {
  en: {
    title: "References",
    officialTitle: "New Threads features announcement",
    officialMeta: "Meta Newsroom · April 2025, updated through October 2025",
    officialNote:
      "The basis for how this guide describes official Insights features. Features and labels change over time, so check your own account.",
    methodTitle: "How Threads Analytics calculates its charts",
    methodMeta: "GitHub · lib/analytics.ts",
    methodNote: "The comparisons in this guide are practical checks, not controlled experiments.",
  },
  "zh-TW": {
    title: "參考資料",
    officialTitle: "Threads 新功能公告",
    officialMeta: "Meta 新聞中心 · 2025 年 4 月發布，更新至 2025 年 10 月",
    officialNote:
      "本文對官方洞察功能的說明，以這份公告為依據。功能和名稱可能改版，請以你的帳號畫面為準。",
    methodTitle: "Threads Analytics 的圖表計算方式",
    methodMeta: "GitHub · lib/analytics.ts",
    methodNote: "本文的比較方法是實務上的檢查，不是對照實驗。",
  },
  ja: {
    title: "参考資料",
    officialTitle: "Threads の新機能に関する発表",
    officialMeta: "Meta ニュースルーム · 2025年4月公開、2025年10月まで更新",
    officialNote:
      "このガイドでの公式インサイトの説明は、この発表にもとづいています。機能や名称は変わることがあるため、自分のアカウントで確認してください。",
    methodTitle: "Threads Analytics のグラフの計算方法",
    methodMeta: "GitHub · lib/analytics.ts",
    methodNote: "このガイドで紹介している比較は実務的な確認方法で、対照実験ではありません。",
  },
};

export function GuideSources({
  locale,
  includeAnnouncement,
}: {
  locale: Locale;
  /** Only guides that describe official Insights features cite Meta. */
  includeAnnouncement: boolean;
}) {
  const copy = sourceCopy[locale];
  const references = [
    ...(includeAnnouncement
      ? [
          {
            href: announcementUrl,
            title: copy.officialTitle,
            meta: copy.officialMeta,
            note: copy.officialNote,
          },
        ]
      : []),
    {
      href: `${siteConfig.github}/blob/main/lib/analytics.ts`,
      title: copy.methodTitle,
      meta: copy.methodMeta,
      note: copy.methodNote,
    },
  ];

  return (
    <section className="article-references" aria-labelledby="guide-references-title">
      <h2 id="guide-references-title">{copy.title}</h2>
      <ul>
        {references.map((reference) => (
          <li key={reference.href}>
            <a href={reference.href} target="_blank" rel="noopener noreferrer">
              {reference.title}
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
            </a>
            <div className="article-reference-meta">{reference.meta}</div>
            <p>{reference.note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
