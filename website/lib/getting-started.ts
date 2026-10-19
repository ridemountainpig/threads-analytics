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
    kicker: "Before you start",
    title: "Is Threads Analytics right for you?",
    description:
      "A free, open-source Threads analytics dashboard for creators who want to keep their own history, on their Mac or on a server they run.",
    items: [
      {
        question: "Is it free?",
        answer:
          "Yes. The software is free and open source, and the Mac app costs nothing to run. If you host the web version instead, you pay your hosting and database provider, depending on their plan and your usage.",
      },
      {
        question: "What do I need?",
        answer:
          "A Threads access token. The Mac app needs nothing else; the web version also needs somewhere to host it and a PostgreSQL database, and the deployment guides walk you through setup. Either way the app renews the token on its own as long as it keeps syncing. On a server, updates and backups are up to you.",
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
          "With the Mac app, in a local database on your Mac. With the web version, in the hosting and database services you choose. If you connect an AI assistant through MCP, it can read whatever the tools you allow return.",
      },
      {
        question: "Who is it for?",
        answer:
          "Creators who want to dig into their own numbers. The Mac app takes a few minutes to set up; the web version suits anyone who doesn’t mind running a small self-hosted app. If you just want a quick look without any setup, the Insights built into Threads is enough.",
      },
    ],
    tokenLink: "How to get a Threads access token",
    chartsLink: "See every chart and how it’s calculated",
  },
  "zh-TW": {
    kicker: "開始前先了解",
    title: "這個 Threads 分析工具適合你嗎？",
    description:
      "免費開源的 Threads 數據分析儀表板，適合想長期保存自己數據的創作者，可以在 Mac 上執行，也能自己架設。",
    items: [
      {
        question: "真的免費嗎？",
        answer:
          "是的。軟體本身免費開源，Mac 版執行起來也不用任何費用。如果改為自架網頁版，主機和資料庫要付費給你選擇的服務商，金額依方案和用量而定。",
      },
      {
        question: "需要準備什麼？",
        answer:
          "一組 Threads Access Token。Mac 版不需要其他東西；網頁版另外需要部署環境和 PostgreSQL 資料庫，照著部署指南就能完成設定。不論哪一種，只要持續同步，Token 就會自動續期。自架時，軟體更新和資料備份由你自己管理。",
      },
      {
        question: "可以分析哪些帳號？",
        answer:
          "你用自己的 Access Token 授權的帳號。資料都來自 Threads 官方 API，看不到別人的私人數據。",
      },
      {
        question: "能抓到以前的資料嗎？",
        answer:
          "貼文可以：舊貼文和目前的指標都能同步。粉絲數就不同了，每日紀錄從第一次同步開始，之前的日子無法補回。",
      },
      {
        question: "資料存在哪裡？",
        answer:
          "用 Mac 版時，存在你 Mac 上的本機資料庫；用網頁版時，存在你選擇的主機和資料庫服務。如果透過 MCP 連接 AI 助理，它能讀取你授權的工具所回傳的資料。",
      },
      {
        question: "適合誰用？",
        answer:
          "想深入研究自己數據的創作者。Mac 版幾分鐘就能設定好；網頁版則適合不介意維護一個自架小工具的人。如果只想快速看一下、不想做任何設定，Threads 內建的洞察報告就夠用了。",
      },
    ],
    tokenLink: "如何取得 Threads Access Token",
    chartsLink: "看所有圖表與計算方式",
  },
  ja: {
    kicker: "はじめる前に",
    title: "Threads Analytics はあなたに合うツール？",
    description:
      "自分のデータを長く残したいクリエイターのための、無料・オープンソースの Threads 分析ダッシュボードです。Mac アプリでも、自分のサーバーでも動かせます。",
    items: [
      {
        question: "無料で使えますか？",
        answer:
          "はい。ソフトウェアは無料のオープンソースで、Mac アプリは費用なしで使えます。Web 版をセルフホストする場合は、選んだホスティングとデータベースのプランや使用量に応じて費用がかかります。",
      },
      {
        question: "何を用意すればよいですか？",
        answer:
          "Threads アクセストークンです。Mac アプリならそれだけで使えます。Web 版はさらにホスティング環境と PostgreSQL データベースが必要で、導入ガイドに沿って設定できます。どちらでも、同期が続いている限りトークンは自動で更新されます。セルフホストの場合、アップデートとバックアップはご自身で管理してください。",
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
          "Mac アプリなら Mac 内のローカルデータベース、Web 版なら自分で選んだホスティングとデータベースのサービスです。MCP で AI アシスタントを接続すると、許可したツールが返すデータを AI も読み取れます。",
      },
      {
        question: "どんな人に向いていますか？",
        answer:
          "自分の数字をじっくり分析したいクリエイターです。Mac アプリなら数分で始められ、Web 版は小さなセルフホストのアプリを運用するのが苦にならない人に向いています。設定なしでざっと確認したいだけなら、Threads に組み込まれたインサイトで十分です。",
      },
    ],
    tokenLink: "Threads アクセストークンの取得方法",
    chartsLink: "すべてのグラフと計算方法を見る",
  },
};
