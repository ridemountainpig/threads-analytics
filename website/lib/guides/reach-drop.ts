import type { Locale } from "../locales";
import type { GuideCopy } from "./index";

// A chart cannot establish an account restriction; start with measurable
// changes and point readers to the account status shown in Threads.

const en: GuideCopy = {
  navTitle: "Why Threads reach drops",
  menuTitle: "Reach drops",
  menuDescription: "Tell a real drop from normal swings",
  metadata: {
    title: "Threads Reach Dropped? Tell a Real Drop from Normal Swings",
    description:
      "Threads views dropped? Before assuming a penalty, compare equal periods, post counts and content mix. A step-by-step way to find out what actually changed.",
  },
  hero: {
    kicker: "GUIDE / REACH",
    lineOne: "Threads reach dropped?",
    lineTwo: "Check whether it’s real before you worry",
    description:
      "When views suddenly fall, the first thought is often “I’ve been restricted.” The cause is often simpler than that. This guide walks through the checks, one step at a time.",
    readingTime: "9 min read",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "Does Threads shadowban accounts?",
        answer:
          "A drop in views alone won’t tell you. Check the account status in your Threads settings first, then compare equal periods and make sure your data is complete. Look for restrictions in Threads itself rather than reading them into a chart.",
      },
      {
        question: "How is Threads reach rate calculated?",
        answer:
          "It depends on the definition. Views ÷ followers is a common ratio, but it isn’t unique reach and can go over 100%. Views ÷ your median views shows how a post did compared with your usual. Neither tells you how many different people saw it.",
      },
      {
        question: "What is a normal Threads reach rate?",
        answer:
          "There’s no universal normal. Other accounts’ benchmarks only help if the metric, audience and format match. Your own median is the best reference point. Track it over time as your account grows.",
      },
      {
        question: "Should I delete posts with low views?",
        answer:
          "No. Low views alone aren’t a reason to delete, and keeping the post gives you data to compare against later.",
      },
    ],
  },
  cta: {
    title: "Build a baseline for spotting real changes.",
    description:
      "Deploy Threads Analytics to keep your post metrics and daily follower snapshots, so the next dip is easier to read.",
    primary: "Deploy the dashboard",
    primaryHref: "#deploy",
    secondary: "Browse all 31 charts",
    note: "Free and open source · Self-hosted · Hosting billed by your provider",
  },
};

const zh: GuideCopy = {
  navTitle: "Threads 觸及率下降怎麼辦",
  menuTitle: "觸及率下降怎麼辦",
  menuDescription: "分辨真的下降還是正常波動",
  metadata: {
    title: "Threads 觸及率下降怎麼辦：先判斷是真的掉還是正常波動",
    description:
      "Threads（脆）觀看數突然下降？先別急著懷疑被限流。比較等長期間、發文篇數和內容組成，一步步找出真正改變的地方。",
  },
  hero: {
    kicker: "指南 / 觸及",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s 觸⁠及⁠率下⁠降⁠怎⁠麼⁠辦⁠？",
    lineTwo: "先⁠判⁠斷是⁠真⁠的⁠掉⁠，還⁠是⁠正⁠常⁠波⁠動",
    description:
      "觀看數突然下滑，第一個念頭常常是「被限流了」。但很多時候，原因比你想的單純。這篇帶你一步步檢查，找出真正改變的地方。",
    readingTime: "閱讀約 9 分鐘",
  },
  faq: {
    title: "常⁠見⁠問⁠題",
    items: [
      {
        question: "Threads 有限流嗎？",
        answer:
          "單看觀看下降無法判斷。先到 Threads 設定查看帳號狀態，再比較等長期間，並確認資料完整。是否受到限制，要以 Threads 裡顯示的狀態為準，而不是從圖表推測。",
      },
      {
        question: "Threads 觸及率怎麼算？",
        answer:
          "要看你怎麼定義。「觀看數 ÷ 粉絲數」是常見的比例，但它不是不重複觸及，也可能超過 100%。「觀看數 ÷ 你的觀看中位數」則能看出這篇和平常相比如何。兩者都無法告訴你實際有多少人看過。",
      },
      {
        question: "Threads 觸及率多少算正常？",
        answer:
          "沒有一個通用的正常值。別人的基準只有在指標、受眾和格式都相近時才有參考價值。你自己的中位數才是最好的參考點，並隨著帳號成長持續追蹤。",
      },
      {
        question: "觀看很低的貼文要刪掉嗎？",
        answer: "不需要。觀看低本身不是刪文的理由，留著還能當之後比較的資料。",
      },
    ],
  },
  cta: {
    title: "建⁠立⁠基⁠準⁠，看⁠懂觀⁠看⁠變⁠化⁠。",
    description:
      "部署 Threads Analytics，保存貼文指標和每日粉絲快照，下次觀看下降時就更容易找出原因。",
    primary: "部署儀表板",
    primaryHref: "#deploy",
    secondary: "瀏覽 31 種圖表",
    note: "免費開源 · 自行託管 · 主機費用依平台方案",
  },
};

const ja: GuideCopy = {
  navTitle: "Threads のリーチが落ちたとき",
  menuTitle: "リーチが落ちたら",
  menuDescription: "本当の減少か通常の揺れかを見分ける",
  metadata: {
    title: "Threads のリーチが落ちた？本当の低下と通常の揺れを見分ける方法",
    description:
      "Threads（スレッズ）の閲覧数が落ちた？ペナルティを疑う前に、同じ長さの期間、投稿数、投稿内容の構成を比べましょう。何が変わったのかを順番に確かめる方法を解説します。",
  },
  hero: {
    kicker: "ガイド / リーチ",
    lineOne: "T⁠h⁠r⁠e⁠a⁠d⁠s のリ⁠ー⁠チ⁠が落⁠ち⁠た⁠ら⁠？",
    lineTwo: "本⁠当⁠の⁠低⁠下⁠か⁠、い⁠つ⁠も⁠の⁠揺⁠れ⁠か⁠を見⁠分⁠け⁠る",
    description:
      "閲覧数が急に落ちると、まず「制限されたのでは」と考えがちです。でも原因は、思っているより単純なことも少なくありません。一つずつ確認して、本当に変わったところを見つけましょう。",
    readingTime: "約9分で読めます",
  },
  faq: {
    title: "よ⁠く⁠あ⁠る⁠質⁠問",
    items: [
      {
        question: "Threads にシャドウバンはありますか？",
        answer:
          "閲覧数の低下だけでは判断できません。まず Threads の設定でアカウントステータスを確認し、同じ長さの期間で比べ、データに抜けがないか確かめましょう。制限の有無は、グラフから推測するのではなく Threads 上の表示で確認します。",
      },
      {
        question: "Threads のリーチ率はどう計算しますか？",
        answer:
          "定義によります。「閲覧数 ÷ フォロワー数」はよく使われる比率ですが、ユニークなリーチではなく、100% を超えることもあります。「閲覧数 ÷ 自分の閲覧数の中央値」なら、いつもと比べてどうだったかがわかります。どちらも実際に何人が見たかは示しません。",
      },
      {
        question: "Threads のリーチ率はどれくらいが普通ですか？",
        answer:
          "どのアカウントにも当てはまる「普通」の値はありません。他のアカウントの基準は、指標、読者層、形式が近い場合にだけ参考になります。一番の基準は自分の中央値です。アカウントの成長に合わせて追いかけましょう。",
      },
      {
        question: "閲覧数の少ない投稿は削除すべき？",
        answer:
          "その必要はありません。閲覧数が少ないことは削除の理由にならず、残しておけばあとで比較に使えます。",
      },
    ],
  },
  cta: {
    title: "本⁠当⁠の⁠変⁠化⁠を見⁠分⁠け⁠る⁠た⁠め⁠の基⁠準⁠を⁠つ⁠く⁠る⁠。",
    description:
      "Threads Analytics をデプロイして投稿の指標とフォロワーの記録を残しておけば、次に閲覧数が落ちたときに原因を読み解きやすくなります。",
    primary: "ダッシュボードをデプロイ",
    primaryHref: "#deploy",
    secondary: "31 種のチャートを見る",
    note: "無料・オープンソース · セルフホスト · ホスティング費用は各サービスの料金による",
  },
};

export const reachDrop: Record<Locale, GuideCopy> = { en, "zh-TW": zh, ja };
