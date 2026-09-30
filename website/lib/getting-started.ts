import type { Locale } from "./locales";

type GettingStartedCopy = {
  kicker: string;
  title: string;
  description: string;
  items: { question: string; answer: string }[];
  tokenLink: string;
  chartsLink: string;
};

export const gettingStarted: Record<Locale, GettingStartedCopy> = {
  en: {
    kicker: "BEFORE YOU START",
    title: "Is Threads Analytics right for you?",
    description:
      "A free, open-source Threads analytics dashboard for creators who want to host their own tools and keep their own history.",
    items: [
      {
        question: "Is it free?",
        answer:
          "The software is free and open source. You pay your hosting and database provider, depending on their plan and your usage.",
      },
      {
        question: "What do I need?",
        answer:
          "Somewhere to host it, a PostgreSQL database and a Threads access token. The deployment guides walk you through setup, and the app renews the token on its own as long as it keeps syncing. Updates and backups are up to you.",
      },
      {
        question: "Which accounts can I analyze?",
        answer:
          "The accounts you authorize with your own access token. Everything comes from the official Threads API, so it can’t see anyone else’s private analytics.",
      },
      {
        question: "Can it pull in older data?",
        answer:
          "For posts, yes: older posts and their current metrics sync in. Follower counts are different. Daily history starts from your first sync and can’t be filled in for earlier days.",
      },
      {
        question: "Where is my data stored?",
        answer:
          "With the hosting and database services you choose. If you connect an AI assistant through MCP, it can read whatever the tools you allow return.",
      },
      {
        question: "Who is it for?",
        answer:
          "Creators who want to dig into their own numbers and don’t mind running a small self-hosted app. If you just want a quick look without any setup, the Insights built into Threads is enough.",
      },
    ],
    tokenLink: "How to get a Threads access token",
    chartsLink: "See every chart and how it’s calculated",
  },
  "zh-TW": {
    kicker: "開始前先了解",
    title: "這⁠個 Threads 分⁠析⁠工⁠具適⁠合⁠你⁠嗎⁠？",
    description: "免費開源的 Threads 數據分析儀表板，適合想自己架設工具、長期保存數據的創作者。",
    items: [
      {
        question: "真的免費嗎？",
        answer: "軟體本身免費開源。主機和資料庫要付費給你選擇的服務商，金額依方案和用量而定。",
      },
      {
        question: "需要準備什麼？",
        answer:
          "一個部署環境、PostgreSQL 資料庫，以及 Threads 存取權杖。照著部署指南就能完成設定，只要持續同步，權杖就會自動續期。軟體更新和資料備份則由你自己管理。",
      },
      {
        question: "可以分析哪些帳號？",
        answer: "你用自己的存取權杖授權的帳號。資料都來自 Threads 官方 API，看不到別人的私人數據。",
      },
      {
        question: "能抓到以前的資料嗎？",
        answer:
          "貼文可以：舊貼文和目前的指標都能同步。粉絲數就不同了，每日紀錄從第一次同步開始，之前的日子無法補回。",
      },
      {
        question: "資料存在哪裡？",
        answer:
          "存在你選擇的主機和資料庫服務。如果透過 MCP 連接 AI 助理，它能讀取你授權的工具所回傳的資料。",
      },
      {
        question: "適合誰用？",
        answer:
          "想深入研究自己數據、也不介意維護一個自架小工具的創作者。如果只想快速看一下、不想做任何設定，Threads 內建的洞察報告就夠用了。",
      },
    ],
    tokenLink: "如何取得 Threads 存取權杖",
    chartsLink: "看所有圖表與計算方式",
  },
  ja: {
    kicker: "はじめる前に",
    title: "Threads Analytics はあなたに合うツール？",
    description:
      "自分でツールをホストし、データを長く残したいクリエイターのための、無料・オープンソースの Threads 分析ダッシュボードです。",
    items: [
      {
        question: "無料で使えますか？",
        answer:
          "ソフトウェアは無料のオープンソースです。ホスティングとデータベースは、選んだサービスのプランや使用量に応じて費用がかかります。",
      },
      {
        question: "何を用意すればよいですか？",
        answer:
          "ホスティング環境、PostgreSQL データベース、Threads アクセストークンの3つです。導入ガイドに沿って設定でき、同期が続いている限りトークンは自動で更新されます。アップデートとバックアップはご自身で管理してください。",
      },
      {
        question: "どのアカウントを分析できますか？",
        answer:
          "自分のアクセストークンで許可したアカウントです。データはすべて Threads の公式 API から取得するため、他人の非公開データは見られません。",
      },
      {
        question: "導入前のデータも取得できますか？",
        answer:
          "投稿は取得できます。過去の投稿と現在の指標がまとめて同期されます。フォロワー数は別で、日ごとの記録は最初の同期から始まり、それ以前の日をあとから埋めることはできません。",
      },
      {
        question: "データはどこに保存されますか？",
        answer:
          "自分で選んだホスティングとデータベースのサービスです。MCP で AI アシスタントを接続すると、許可したツールが返すデータを AI も読み取れます。",
      },
      {
        question: "どんな人に向いていますか？",
        answer:
          "自分の数字をじっくり分析したく、小さなセルフホストのアプリを運用するのが苦にならないクリエイターです。設定なしでざっと確認したいだけなら、Threads に組み込まれたインサイトで十分です。",
      },
    ],
    tokenLink: "Threads アクセストークンの取得方法",
    chartsLink: "すべてのグラフと計算方法を見る",
  },
};
