import type { Locale } from "../locales";
import { bestTimeToPost } from "./best-time-to-post";
import { reachDrop } from "./reach-drop";
import { threadsInsights } from "./threads-insights";

// Long-form guides that answer the question-shaped searches the product
// pages cannot rank for ("how do I read Threads Insights", "best time to
// post"). One file per guide; this module is the registry the page, sitemap,
// footer and OG generator all read from.

export const guideSlugs = ["threads-insights", "best-time-to-post", "reach-drop"] as const;

export type GuideSlug = (typeof guideSlugs)[number];

export function isGuideSlug(value: string): value is GuideSlug {
  return (guideSlugs as readonly string[]).includes(value);
}

/**
 * One piece of article body. Text fields accept two inline marks:
 * `**bold**` and `[label](href)`, where an href starting with "/" is
 * resolved against the current locale.
 */
export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; text: string }
  | { type: "table"; head: string[]; rows: string[][]; caption: string }
  | { type: "figure"; image: GuideImage; alt: string; caption: string };

/** Dashboard screenshots in public/guides/, rendered with demo data. */
export type GuideImage = "performance" | "audience";

export const guideImages: Record<GuideImage, { src: string; width: number; height: number }> = {
  performance: { src: "/guides/performance.webp", width: 1600, height: 783 },
  audience: { src: "/guides/audience.webp", width: 1600, height: 783 },
};

export type GuideFaqItem = {
  question: string;
  answer: string;
};

export type GuideCopy = {
  /** Short label for the footer and related-guide cards. */
  navTitle: string;
  /** Even shorter label for the header and mobile menus. */
  menuTitle: string;
  /** One line under menuTitle in the desktop header dropdown. */
  menuDescription: string;
  metadata: { title: string; description: string };
  hero: {
    /** Category line above the title; also the OG image footer. */
    kicker: string;
    /** The article title, split in two for the OG image. */
    lineOne: string;
    lineTwo: string;
    /** Standfirst under the title. */
    description: string;
    readingTime: string;
  };
  body: GuideBlock[];
  faq: {
    title: string;
    items: GuideFaqItem[];
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    /** Locale-relative path or in-page anchor on the home page. */
    primaryHref: string;
    secondary: string;
    note: string;
  };
};

export type GuideUi = {
  relatedKicker: string;
  relatedTitle: string;
  relatedDescription: string;
  readMore: string;
  allGuides: string;
  updatedLabel: string;
};

export const guideUi: Record<Locale, GuideUi> = {
  en: {
    relatedKicker: "KEEP READING",
    relatedTitle: "More guides for your Threads data.",
    relatedDescription:
      "Read your metrics, find your posting times, and work out why your views changed.",
    readMore: "Read the guide",
    allGuides: "All guides",
    updatedLabel: "Updated",
  },
  "zh-TW": {
    relatedKicker: "延伸閱讀",
    relatedTitle: "更⁠多 T⁠h⁠r⁠e⁠a⁠d⁠s 數⁠據⁠分⁠析⁠指⁠南⁠。",
    relatedDescription: "看懂指標、找出發文時段，弄清楚觀看數為什麼變了。",
    readMore: "閱讀全文",
    allGuides: "所有指南",
    updatedLabel: "更新於",
  },
  ja: {
    relatedKicker: "あわせて読む",
    relatedTitle: "T⁠h⁠r⁠e⁠a⁠d⁠s デ⁠ー⁠タ⁠分⁠析⁠のガ⁠イ⁠ド⁠をも⁠っ⁠と⁠。",
    relatedDescription: "指標の読み方、投稿時間の見つけ方、閲覧数が変わった理由の調べ方。",
    readMore: "ガイドを読む",
    allGuides: "すべてのガイド",
    updatedLabel: "更新日",
  },
};

/** Copy for the /guides hub that lists every guide. */
export type GuideHubCopy = {
  metadata: { title: string; description: string };
  /** Breadcrumb name for the hub. */
  label: string;
  /** Hero kicker; also the OG image footer. */
  kicker: string;
  /** The hub title, split in two; line two gets the gradient. */
  lineOne: string;
  lineTwo: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  note: string;
  /** Dark hero panel listing the guides in reading order. */
  path: { label: string; badge: string; totalLabel: string; minutes: string; hint: string };
  list: { kicker: string; title: string; description: string; outlineLabel: string };
  cta: { title: string; description: string; primary: string; secondary: string; note: string };
};

export const guideHub: Record<Locale, GuideHubCopy> = {
  en: {
    metadata: {
      title: "Threads Analytics Guides: Insights, Posting Times and Reach",
      description:
        "Practical guides to your Threads data: read Insights, find your best time to post, and check whether a drop in views is real, using your own posts.",
    },
    label: "Guides",
    kicker: "Guides / Threads data",
    lineOne: "Threads analytics guides,",
    lineTwo: "from reading numbers to finding causes.",
    description:
      "Three step-by-step guides that work with your own posts: read Threads Insights, find the hours that suit your audience, and check whether a drop in views is real.",
    primaryCta: "Start with the first guide",
    secondaryCta: "Browse all 31 charts",
    note: "Under 10 minutes each · No tool required · Works in a spreadsheet",
    path: {
      label: "Reading path",
      badge: "3 guides",
      totalLabel: "minutes to read all three",
      minutes: "min",
      hint: "Read them in order, or start with the question you have right now.",
    },
    list: {
      kicker: "THE GUIDES",
      title: "Learn the metrics first, then find the cause.",
      description:
        "Each guide stands on its own, and every example is one you can repeat on your own data.",
      outlineLabel: "Inside",
    },
    cta: {
      title: "Try every step on your own data.",
      description:
        "Deploy Threads Analytics and connect your account. The comparisons in these guides are built into its charts.",
      primary: "Deploy the dashboard",
      secondary: "View on GitHub",
      note: "Free and open source · Self-hosted · Hosting billed by your provider",
    },
  },
  "zh-TW": {
    metadata: {
      title: "Threads（脆）數據分析指南：洞察報告、發文時間、觸及率",
      description:
        "Threads（脆）數據分析教學：看懂洞察報告的每個數字、用自己的貼文找出最佳發文時間，並判斷觸及率下降是真的掉還是正常波動。",
    },
    label: "指南",
    kicker: "指南 / Threads 數據",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s 數⁠據⁠分⁠析⁠指⁠南⁠，",
    lineTwo: "從⁠看⁠懂⁠數⁠字到⁠找⁠出⁠原⁠因⁠。",
    description:
      "三篇一步步的教學，全部用你自己的貼文來練習：看懂 Threads 洞察報告、找出適合受眾的發文時段，並判斷觀看數下降是不是真的。",
    primaryCta: "從第一篇開始",
    secondaryCta: "瀏覽 31 種圖表",
    note: "每篇不到 10 分鐘 · 不需要安裝工具 · 用試算表也能照做",
    path: {
      label: "閱讀路線",
      badge: "3 篇",
      totalLabel: "分鐘讀完三篇",
      minutes: "分鐘",
      hint: "建議依序閱讀，也可以直接從你現在的問題開始。",
    },
    list: {
      kicker: "三篇指南",
      title: "先⁠看⁠懂⁠指⁠標⁠，再⁠找⁠出⁠原⁠因⁠。",
      description: "每篇都能單獨閱讀，裡面的範例都能用你自己的數據照做一次。",
      outlineLabel: "內容",
    },
    cta: {
      title: "用⁠自⁠己⁠的⁠數⁠據⁠，把⁠每⁠一⁠步⁠做⁠一⁠次⁠。",
      description: "部署 Threads Analytics 並連接帳號，指南裡的比較方法，儀表板都有對應的圖表。",
      primary: "部署儀表板",
      secondary: "前往 GitHub",
      note: "免費開源 · 自行託管 · 主機費用依平台方案",
    },
  },
  ja: {
    metadata: {
      title: "Threads（スレッズ）分析ガイド：インサイト・投稿時間・リーチ",
      description:
        "Threads（スレッズ）のデータ分析ガイド。インサイトの数字の読み方、自分の投稿から最適な投稿時間を見つける方法、リーチが落ちたときの確かめ方を解説します。",
    },
    label: "ガイド",
    kicker: "ガイド / Threads データ",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s デ⁠ー⁠タ⁠分⁠析ガ⁠イ⁠ド⁠。",
    lineTwo: "数⁠字⁠の読⁠み⁠方⁠か⁠ら⁠、原⁠因⁠探⁠し⁠ま⁠で⁠。",
    description:
      "自分の投稿を使って進める、3本のステップ解説です。Threads インサイトの読み方、読者に合う投稿時間の見つけ方、閲覧数の低下が本物かどうかの確かめ方を紹介します。",
    primaryCta: "1本目から読む",
    secondaryCta: "31 種のチャートを見る",
    note: "各10分以内 · ツール不要 · 表計算ソフトでも実践できます",
    path: {
      label: "読む順番",
      badge: "3 本",
      totalLabel: "分で3本すべて読めます",
      minutes: "分",
      hint: "順番に読むのがおすすめですが、今の疑問から読んでもかまいません。",
    },
    list: {
      kicker: "3本のガイド",
      title: "指⁠標⁠を理⁠解⁠し⁠て⁠か⁠ら⁠、原⁠因⁠を⁠探⁠す⁠。",
      description: "どのガイドも単独で読めて、紹介している例は自分のデータでそのまま試せます。",
      outlineLabel: "内容",
    },
    cta: {
      title: "す⁠べ⁠て⁠の手⁠順⁠を⁠、自⁠分⁠のデ⁠ー⁠タ⁠で⁠。",
      description:
        "Threads Analytics をデプロイしてアカウントを連携すれば、ガイドで紹介した比較をダッシュボードのグラフでそのまま確認できます。",
      primary: "ダッシュボードをデプロイ",
      secondary: "GitHub で見る",
      note: "無料・オープンソース · セルフホスト · ホスティング費用は各サービスの料金による",
    },
  },
};

/**
 * Per-guide article facts: ISO dates for the byline and Article schema, and
 * whether the guide describes official Insights features, which is what the
 * Meta announcement in the references backs up.
 */
export const guideMeta: Record<
  GuideSlug,
  { published: string; modified: string; citesMetaAnnouncement: boolean }
> = {
  "threads-insights": {
    published: "2026-09-30",
    modified: "2026-09-30",
    citesMetaAnnouncement: true,
  },
  "best-time-to-post": {
    published: "2026-09-30",
    modified: "2026-09-30",
    citesMetaAnnouncement: false,
  },
  "reach-drop": { published: "2026-09-30", modified: "2026-09-30", citesMetaAnnouncement: false },
};

/** Byline for the guides; matches the Article schema author. */
export const guideAuthor = {
  name: "Yen Cheng",
  initials: "YC",
  url: "https://yencheng.dev/",
} as const;

export const guides: Record<GuideSlug, Record<Locale, GuideCopy>> = {
  "threads-insights": threadsInsights,
  "best-time-to-post": bestTimeToPost,
  "reach-drop": reachDrop,
};

export function getGuide(slug: GuideSlug, locale: Locale) {
  return guides[slug][locale];
}
