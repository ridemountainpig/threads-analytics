import type { Locale } from "../locales";
import type { GuideCopy } from "./index";

// Deliberately avoids quoting a universal "best hour": the whole point of
// the guide is that the answer comes from the reader's own posts.

const en: GuideCopy = {
  navTitle: "Best time to post on Threads",
  menuTitle: "Best time to post",
  menuDescription: "Find your window in your own posts",
  metadata: {
    title: "Best Time to Post on Threads: Find Your Own Posting Window",
    description:
      "There’s no universal best time to post on Threads. Find yours from your own post history: group by hour, compare medians, check sample sizes, then test.",
  },
  hero: {
    kicker: "GUIDE / POSTING TIME",
    lineOne: "The best time to post on Threads",
    lineTwo: "is hiding in your own posts",
    description:
      "Every “best time to post” list gives a different answer, because every audience is different. Here’s how to find promising hours in your own post history and test them properly.",
    readingTime: "8 min read",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "What is the best time to post on Threads?",
        answer:
          "There isn’t one hour that works for every account. Start with times you can keep up, compare similar posts in one time zone, and test the hours that look strongest.",
      },
      {
        question: "Does the day of the week matter on Threads?",
        answer:
          "It can, depending on your audience and content. Compare weekdays using similar posts, and remember that splitting by both weekday and hour leaves fewer posts in each group.",
      },
      {
        question: "How many times a day should I post on Threads?",
        answer:
          "There’s no fixed number. When you change how often you post, watch total views as well as views per post: the typical post may get fewer views while your total goes up. Threads Analytics groups posting frequency by week.",
      },
      {
        question: "Does scheduling a post hurt reach?",
        answer:
          "If your scheduled posts seem to do worse, first compare them with manual posts on similar topics, formats and hours. The difference may come from those factors rather than the scheduling itself.",
      },
    ],
  },
  cta: {
    title: "Find your posting window from your own posts.",
    description:
      "Deploy Threads Analytics and connect your account to compare posting times across your post history.",
    primary: "Deploy the dashboard",
    primaryHref: "#deploy",
    secondary: "Browse all 31 charts",
    note: "Free and open source · Self-hosted · Hosting billed by your provider",
  },
};

const zh: GuideCopy = {
  navTitle: "Threads 最佳發文時間怎麼找",
  menuTitle: "最佳發文時間",
  menuDescription: "從自己的貼文找出發文時段",
  metadata: {
    title: "Threads 最佳發文時間怎麼找：用自己的數據找出適合的發文時段",
    description:
      "Threads（脆）沒有通用的最佳發文時間。教你用自己的貼文紀錄找出適合的時段：依小時分組、比較中位數、確認樣本數，再實際測試。",
  },
  hero: {
    kicker: "指南 / 發文時間",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s 最⁠佳⁠發⁠文⁠時⁠間怎⁠麼⁠找⁠？",
    lineTwo: "用⁠自⁠己⁠的⁠數⁠據找⁠出⁠來",
    description:
      "網路上的「最佳發文時間」各說各話，因為每個帳號的受眾都不一樣。這篇教你用自己的貼文紀錄，找出值得測試的時段，再用簡單的方法驗證。",
    readingTime: "閱讀約 8 分鐘",
  },
  faq: {
    title: "常⁠見⁠問⁠題",
    items: [
      {
        question: "Threads 幾點發文最好？",
        answer:
          "沒有一個對所有帳號都適用的時間。從你能持續維持的時段開始，用同一個時區比較相似的貼文，再測試表現最好的幾個時段。",
      },
      {
        question: "Threads 發文星期幾有差嗎？",
        answer:
          "可能有，取決於你的受眾和內容。用相似的貼文比較星期幾，也要記得同時按星期和小時拆分後，每組的貼文會變少。",
      },
      {
        question: "Threads 一天發幾篇比較好？",
        answer:
          "沒有固定答案。調整發文頻率時，總觀看和單篇觀看都要看：單篇表現可能下降，總觀看卻上升。Threads Analytics 的發文頻率分析以週為單位。",
      },
      {
        question: "排程發文會影響觸及嗎？",
        answer:
          "如果排程貼文看起來表現比較差，先拿主題、格式、發文時段相近的手動貼文來比較。差異可能來自這些因素，而不是排程本身。",
      },
    ],
  },
  cta: {
    title: "用⁠自⁠己⁠的⁠貼⁠文找⁠出發⁠文⁠時⁠段⁠。",
    description: "部署 Threads Analytics 並連接帳號，就能用你的貼文紀錄比較各個發文時段。",
    primary: "部署儀表板",
    primaryHref: "#deploy",
    secondary: "瀏覽 31 種圖表",
    note: "免費開源 · 自行託管 · 主機費用依平台方案",
  },
};

const ja: GuideCopy = {
  navTitle: "Threads の最適な投稿時間",
  menuTitle: "最適な投稿時間",
  menuDescription: "自分の投稿から時間帯を見つける",
  metadata: {
    title: "Threads の最適な投稿時間の見つけ方：自分のデータから合う時間帯を探す",
    description:
      "Threads（スレッズ）には、どのアカウントにも当てはまる最適な投稿時間はありません。自分の投稿履歴から見つける方法を、時間帯別の集計、中央値の比較、件数の確認、検証の順に解説します。",
  },
  hero: {
    kicker: "ガイド / 投稿時間",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s の最⁠適⁠な⁠投⁠稿⁠時⁠間⁠は⁠、",
    lineTwo: "自⁠分⁠の⁠デ⁠ー⁠タ⁠で見⁠つ⁠け⁠る",
    description:
      "「おすすめ投稿時間」の答えが記事ごとに違うのは、アカウントごとに読者が違うからです。自分の投稿履歴から試す価値のある時間帯を見つけ、きちんと検証する方法を紹介します。",
    readingTime: "約8分で読めます",
  },
  faq: {
    title: "よ⁠く⁠あ⁠る⁠質⁠問",
    items: [
      {
        question: "Threads に投稿するのに最適な時間は？",
        answer:
          "すべてのアカウントに合う時間はありません。続けやすい時間から始め、同じタイムゾーンで似た投稿を比べ、成績の良い時間帯を試してみましょう。",
      },
      {
        question: "Threads では曜日も関係ありますか？",
        answer:
          "読者や内容によっては関係します。似た投稿で曜日を比べましょう。ただし曜日と時間帯の両方で分けると、各グループの件数が少なくなる点に注意が必要です。",
      },
      {
        question: "Threads は 1 日に何回投稿すべき？",
        answer:
          "決まった回数はありません。頻度を変えるときは、総閲覧数と投稿ごとの閲覧数の両方を見ましょう。1件あたりの閲覧は減っても、合計は増えることがあります。Threads Analytics の投稿頻度の分析は週単位です。",
      },
      {
        question: "予約投稿はリーチに不利ですか？",
        answer:
          "予約投稿の成績が低く見えるなら、まずテーマ・形式・投稿時間が近い通常の投稿と比べてみましょう。差の原因は予約そのものではなく、そうした条件の違いかもしれません。",
      },
    ],
  },
  cta: {
    title: "自⁠分⁠の⁠投⁠稿⁠か⁠ら投⁠稿⁠時⁠間⁠を見⁠つ⁠け⁠る⁠。",
    description:
      "Threads Analytics をデプロイしてアカウントを連携すれば、投稿履歴をもとに時間帯ごとの成績を比べられます。",
    primary: "ダッシュボードをデプロイ",
    primaryHref: "#deploy",
    secondary: "31 種のチャートを見る",
    note: "無料・オープンソース · セルフホスト · ホスティング費用は各サービスの料金による",
  },
};

export const bestTimeToPost: Record<Locale, GuideCopy> = { en, "zh-TW": zh, ja };
