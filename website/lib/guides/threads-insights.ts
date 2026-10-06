import type { Locale } from "../locales";
import type { GuideCopy } from "./index";

// Describes the official Insights screen at the level Meta documents it; the
// layout changes often, so the copy avoids naming exact buttons.

const en: GuideCopy = {
  navTitle: "Threads Insights explained",
  menuTitle: "Insights explained",
  menuDescription: "What views and interactions count",
  metadata: {
    title: "Threads Insights Explained: Views, Interactions and Followers",
    description:
      "Where to find Threads Insights, what views, interactions and followers count, how to read Home / Profile / Search, and what to check when numbers look off.",
  },
  hero: {
    kicker: "GUIDE / THREADS INSIGHTS",
    lineOne: "How to read Threads Insights:",
    lineTwo: "views, interactions and followers",
    description:
      "You open Insights, see a wall of numbers, and aren’t sure which ones matter. This guide walks through what views, interactions and followers each count, and which conclusions the numbers can’t support.",
    readingTime: "8 min read",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "What does 'Search' mean in Threads Insights?",
        answer:
          "It’s the share of views that came from Threads search. It doesn’t show what people searched for, so a higher share doesn’t necessarily mean more people are looking you up by name.",
      },
      {
        question: "What is the difference between views and reach?",
        answer:
          "Views count how many times a post was seen. Reach usually means how many different people saw it. Threads Insights reports views. Views divided by followers is a useful ratio, but it isn’t a reach rate.",
      },
      {
        question: "Can I see Threads Insights older than 90 days?",
        answer:
          "Insights compares up to 90 days at a time. Your older posts are still there, and a tool using the API can fetch them, but past daily follower counts can’t be recovered. They can only be recorded from now on.",
      },
      {
        question: "Is there a free Threads analytics tool?",
        answer:
          "Yes. Threads Analytics is free and open source. You host it yourself, so you’ll need a server, a PostgreSQL database and a Threads access token. Hosting and database providers may charge for their services.",
      },
    ],
  },
  cta: {
    title: "Start keeping your own records.",
    description:
      "Deploy Threads Analytics and every sync adds to a history you can compare across months, not just the last 90 days.",
    primary: "Deploy the dashboard",
    primaryHref: "#deploy",
    secondary: "Browse all 31 charts",
    note: "Free and open source · Self-hosted · Hosting billed by your provider",
  },
};

const zh: GuideCopy = {
  navTitle: "Threads 洞察報告怎麼看",
  menuTitle: "洞察報告怎麼看",
  menuDescription: "瀏覽、互動、粉絲各算什麼",
  metadata: {
    title: "Threads 洞察報告怎麼看：瀏覽次數、搜尋、個人檔案每個數字的意思",
    description:
      "Threads（脆）洞察報告在哪裡看？瀏覽次數、互動、粉絲各代表什麼，「首頁 / 個人檔案 / 搜尋」來源怎麼解讀，數字怪怪的時候該先檢查什麼，一次講清楚。",
  },
  hero: {
    kicker: "指南 / THREADS 洞察報告",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s 洞⁠察⁠報⁠告怎⁠麼⁠看⁠？",
    lineTwo: "瀏⁠覽⁠、互⁠動⁠、粉⁠絲一⁠次⁠看⁠懂",
    description:
      "打開洞察報告，看到一堆數字卻不知道該看哪個？這篇帶你搞懂瀏覽次數、互動和粉絲各自代表什麼，以及哪些結論其實讀不出來。",
    readingTime: "閱讀約 8 分鐘",
  },
  faq: {
    title: "常⁠見⁠問⁠題",
    items: [
      {
        question: "Threads 洞察報告的「搜尋」是什麼意思？",
        answer:
          "代表你的瀏覽中，來自 Threads 搜尋的占比。它不會顯示對方搜尋了什麼，所以占比變高，不一定是更多人在搜尋你的名字。",
      },
      {
        question: "瀏覽次數和觸及人數有什麼不同？",
        answer:
          "瀏覽次數是貼文被看到的次數，觸及人數通常指看過的不同人數。Threads 洞察報告提供的是瀏覽次數。瀏覽數除以粉絲數可以當作參考比例，但它不是觸及率。",
      },
      {
        question: "洞察報告可以看 90 天以前的資料嗎？",
        answer:
          "洞察報告一次最多比較 90 天。舊貼文本身還在，使用 API 的工具也能抓回來。但過去每一天的粉絲數無法回溯，只能從現在開始記錄。",
      },
      {
        question: "有免費的 Threads 分析工具嗎？",
        answer:
          "有。Threads Analytics 免費開源，需要自己部署：準備主機、PostgreSQL 資料庫和 Threads 存取權杖。主機和資料庫可能依方案收費。",
      },
    ],
  },
  cta: {
    title: "開⁠始⁠累⁠積自⁠己⁠的分⁠析⁠紀⁠錄⁠。",
    description: "部署 Threads Analytics，每次同步都會幫你累積歷史紀錄，能比較的不只是最近 90 天。",
    primary: "部署儀表板",
    primaryHref: "#deploy",
    secondary: "瀏覽 31 種圖表",
    note: "免費開源 · 自行託管 · 主機費用依平台方案",
  },
};

const ja: GuideCopy = {
  navTitle: "Threads インサイトの見方",
  menuTitle: "インサイトの見方",
  menuDescription: "閲覧数・反応・フォロワーの数え方",
  metadata: {
    title: "Threads インサイトの見方：閲覧数・インタラクション・フォロワーの意味",
    description:
      "Threads（スレッズ）のインサイトはどこで見られる？閲覧数・インタラクション・フォロワーが何を数えているのか、ホーム / プロフィール / 検索の流入元の読み方、数字がおかしいときの確認ポイントをまとめました。",
  },
  hero: {
    kicker: "ガイド / THREADS インサイト",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s イ⁠ン⁠サ⁠イ⁠ト⁠の見⁠方⁠：",
    lineTwo: "閲⁠覧⁠数⁠・イ⁠ン⁠タ⁠ラ⁠ク⁠シ⁠ョ⁠ン⁠・フ⁠ォ⁠ロ⁠ワ⁠ー⁠を読⁠み⁠解⁠く",
    description:
      "インサイトを開いたものの、数字が多すぎてどれを見ればいいかわからない。そんな人のために、閲覧数・インタラクション・フォロワーがそれぞれ何を数えているのか、そして数字からは読み取れないことを整理しました。",
    readingTime: "約8分で読めます",
  },
  faq: {
    title: "よ⁠く⁠あ⁠る⁠質⁠問",
    items: [
      {
        question: "Threads インサイトの「検索」とは何ですか？",
        answer:
          "Threads の検索から投稿が見られた割合です。何が検索されたかは表示されないため、割合が増えても、あなたの名前で検索する人が増えたとは限りません。",
      },
      {
        question: "閲覧数とリーチの違いは？",
        answer:
          "閲覧数は投稿が表示された回数、リーチは一般に投稿を見た人の数を指します。Threads インサイトで表示されるのは閲覧数です。閲覧数 ÷ フォロワー数は参考になる比率ですが、リーチ率ではありません。",
      },
      {
        question: "90 日より前のインサイトは見られますか？",
        answer:
          "インサイトで一度に比較できるのは最大90日です。過去の投稿自体は残っていて、API を使うツールなら取得できます。ただし過去の日ごとのフォロワー数はさかのぼれないため、これから記録していくしかありません。",
      },
      {
        question: "無料の Threads 分析ツールはありますか？",
        answer:
          "あります。Threads Analytics は無料のオープンソースで、自分でデプロイして使います。サーバー、PostgreSQL データベース、Threads アクセストークンが必要で、ホスティングやデータベースには利用プランに応じた費用がかかる場合があります。",
      },
    ],
  },
  cta: {
    title: "自⁠分⁠の分⁠析⁠記⁠録⁠を残⁠し⁠は⁠じ⁠め⁠る⁠。",
    description:
      "Threads Analytics をデプロイすれば、同期のたびに履歴がたまり、直近90日を超えて比較できるようになります。",
    primary: "ダッシュボードをデプロイ",
    primaryHref: "#deploy",
    secondary: "31 種のチャートを見る",
    note: "無料・オープンソース · セルフホスト · ホスティング費用は各サービスの料金による",
  },
};

export const threadsInsights: Record<Locale, GuideCopy> = { en, "zh-TW": zh, ja };
