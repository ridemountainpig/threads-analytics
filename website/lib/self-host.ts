import type { Locale } from "./locales";

// Copy around the self-host guide at /deploy/self-host. The guide itself is
// MDX, one file per locale, in content/self-host/.

export type SelfHostCopy = {
  /** Label in the header and mobile menus. */
  menuTitle: string;
  /** One line under menuTitle in the desktop header dropdown. */
  menuDescription: string;
  /** Longer label for the footer. */
  navTitle: string;
  metadata: { title: string; description: string };
  hero: {
    /** Category line above the title, "Section / Topic"; also the OG image footer. */
    kicker: string;
    /** The title, split in two for the OG image. */
    lineOne: string;
    lineTwo: string;
    description: string;
  };
  tocTitle: string;
  updatedLabel: string;
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
    /** Label for the links to the agent deploy guides. */
    others: string;
  };
};

/** ISO dates for the byline, Article schema and sitemap; update `modified` by
 * hand when the guide changes. */
export const selfHostMeta = { published: "2026-10-04", modified: "2026-10-04" };

export const selfHost: Record<Locale, SelfHostCopy> = {
  en: {
    menuTitle: "Self-host guide",
    menuDescription: "Docker, env vars, sync and updates",
    navTitle: "Self-host with Docker",
    metadata: {
      title: "Self-Host Threads Analytics with Docker: Setup, Auto-Sync and Updates",
      description:
        "Self-host Threads Analytics with Docker, from source or on Vercel: the environment variables to set, how to keep posts syncing automatically, and how to update.",
    },
    hero: {
      kicker: "DEPLOY / SELF-HOST",
      lineOne: "Self-host Threads Analytics",
      lineTwo: "with Docker, Node.js or Vercel",
      description:
        "Everything a hand-built deployment needs: a PostgreSQL database, three required environment variables, a way to keep posts syncing, and updates that keep your data.",
    },
    tocTitle: "On this page",
    updatedLabel: "Updated",
    cta: {
      title: "Deployed? Connect your Threads account.",
      description:
        "Sign in with your APP_PASSWORD, then paste a Threads access token in Settings. The token guide gets you one in 18 steps.",
      primary: "Get an access token",
      secondary: "View on GitHub",
      others: "OR LET AN AGENT DEPLOY IT",
    },
  },
  "zh-TW": {
    menuTitle: "自架部署教學",
    menuDescription: "Docker、環境變數、同步與更新",
    navTitle: "用 Docker 自架部署",
    metadata: {
      title: "自架 Threads Analytics：Docker 部署、環境變數、自動同步與更新",
      description:
        "用 Docker、原始碼或 Vercel 自架 Threads Analytics 數據分析儀表板：需要設定哪些環境變數、怎麼讓貼文自動同步，以及之後如何更新。",
    },
    hero: {
      kicker: "部署 / 自架",
      lineOne: "自⁠架 T⁠h⁠r⁠e⁠a⁠d⁠s A⁠n⁠a⁠l⁠y⁠t⁠i⁠c⁠s⁠：",
      lineTwo: "D⁠o⁠c⁠k⁠e⁠r 與原⁠始⁠碼部⁠署⁠教⁠學",
      description:
        "手動部署需要的東西都在這裡：一個 PostgreSQL 資料庫、三個必填的環境變數、讓貼文持續同步的方法，以及不會遺失資料的更新方式。",
    },
    tocTitle: "本頁內容",
    updatedLabel: "更新於",
    cta: {
      title: "部⁠署⁠好⁠了⁠？接⁠著⁠連⁠接 T⁠h⁠r⁠e⁠a⁠d⁠s 帳⁠號⁠。",
      description:
        "用 APP_PASSWORD 登入後，到設定頁貼上 Threads Access Token。Token 生成教學用 18 個步驟帶你拿到它。",
      primary: "取得 Access Token",
      secondary: "前往 GitHub",
      others: "或交給 Agent 部署",
    },
  },
  ja: {
    menuTitle: "セルフホストガイド",
    menuDescription: "Docker・環境変数・同期・更新",
    navTitle: "Docker でセルフホスト",
    metadata: {
      title: "Threads Analytics をセルフホスト：Docker での構築・自動同期・更新",
      description:
        "Threads Analytics を Docker、ソース、Vercel でセルフホストする方法。設定する環境変数、投稿を自動で同期し続ける方法、データを失わずに更新する手順をまとめました。",
    },
    hero: {
      kicker: "デプロイ / セルフホスト",
      lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s A⁠n⁠a⁠l⁠y⁠t⁠i⁠c⁠s を",
      lineTwo: "D⁠o⁠c⁠k⁠e⁠r でセ⁠ル⁠フ⁠ホ⁠ス⁠ト",
      description:
        "手動デプロイに必要なものをまとめました。PostgreSQL データベース、必須の環境変数 3 つ、投稿を同期し続ける方法、データを失わない更新手順です。",
    },
    tocTitle: "このページの内容",
    updatedLabel: "更新日",
    cta: {
      title: "デ⁠プ⁠ロ⁠イ⁠で⁠き⁠た⁠ら⁠、T⁠h⁠r⁠e⁠a⁠d⁠s ア⁠カ⁠ウ⁠ン⁠ト⁠を連⁠携⁠。",
      description:
        "APP_PASSWORD でログインし、設定画面で Threads アクセストークンを貼り付けます。取得方法はトークンガイドの 18 ステップで解説しています。",
      primary: "アクセストークンを取得",
      secondary: "GitHub で見る",
      others: "エージェントに任せる",
    },
  },
};
