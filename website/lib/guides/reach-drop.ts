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
  body: [
    {
      type: "p",
      text: "A few posts in a row come in below your usual views, and the doubts start. Have you been restricted? Did the algorithm change?",
    },
    {
      type: "p",
      text: "Hold on. To find out whether your account is restricted, check the account status in your Threads settings; that’s more reliable than guessing from numbers. Views can drop for many reasons: you posted less, your content shifted, or a strong day just left the date range. Any of these can make the numbers look worse without anything being wrong with your account.",
    },
    {
      type: "p",
      text: "A note on wording: when people say their reach dropped, they usually mean their views did. Threads counts views, not the number of people who saw a post, so this guide works with views and checks each cause using your own data. For what each Insights number means, see [Threads Insights explained](/guides/threads-insights).",
    },
    { type: "h2", text: "First, make sure it’s a real drop" },
    {
      type: "p",
      text: "One slow week isn’t a trend. Start by comparing two periods of the same length, and look beyond the total. Four numbers matter: **median** views per post, **average** views per post, **total** views and the **number of posts**.",
    },
    {
      type: "p",
      text: "Put together, they tell you a lot. In this example, total views fall even though reach hasn’t changed:",
    },
    {
      type: "table",
      head: ["", "Last month", "This month"],
      rows: [
        ["Posts", "20", "12"],
        ["Total views", "48,000", "30,000"],
        ["Median views per post", "1,800", "1,850"],
        ["Average views per post", "2,400", "2,500"],
      ],
      caption: "Demo data for illustration.",
    },
    {
      type: "p",
      text: "Total views fell by nearly 40%, which looks alarming. But the median and average per post barely moved. The only real difference is eight fewer posts. Here the issue isn’t reach, it’s volume.",
    },
    {
      type: "p",
      text: "Two other false alarms are worth ruling out. One is the **rolling range**, a window like “the last 30 days” that moves forward one day at a time. As soon as a peak day slides out, the total drops, even if your recent posts are doing just as well. The other is **very recent posts**, which are still collecting views and drag the numbers down. Leave out anything from the last few days.",
    },
    { type: "h2", text: "Five changes worth checking" },
    {
      type: "p",
      text: "If the drop is real, these are the places to look. Each one is a hypothesis you can test with data, not a verdict on what the algorithm did.",
    },
    { type: "h3", text: "Your format or topic shifted" },
    {
      type: "p",
      text: "Compare posts of the same format and topic. If your mix changed, say fewer images and more text, the overall median can move even when each type performs exactly as before.",
    },
    { type: "h3", text: "Your posting rhythm changed" },
    {
      type: "p",
      text: "The table above covered how many posts you publish; this is about spacing, such as a break of a week or two, or a switch from daily posts to weekend bursts. In Threads Analytics, the Posting Activity and Posting Gap vs Performance charts show this. If views dipped after a break, check whether your topics or formats changed around the same time too.",
    },
    { type: "h3", text: "Your posting time moved" },
    {
      type: "p",
      text: "See whether you started posting at different hours, and compare similar posts across them. [Best time to post on Threads](/guides/best-time-to-post) covers this step by step.",
    },
    { type: "h3", text: "More links, fewer questions" },
    {
      type: "p",
      text: "Within the same topic and format, compare posts with and without links, or with and without a question. Every audience reacts differently, and your own numbers will show whether it matters for yours.",
    },
    { type: "h3", text: "Something changed on the platform" },
    {
      type: "p",
      text: "Check Threads’ official announcements and the account status in your settings. If many accounts report a drop at the same time, a platform change is worth watching. And make sure your data syncs didn’t fail.",
    },
    { type: "h2", text: "Narrowing it down with charts" },
    {
      type: "p",
      text: "Once you have a direction, charts can help confirm it. The examples below use charts from Threads Analytics.",
    },
    {
      type: "p",
      text: "**Reach Growth Trend** and **Views Distribution** show where the change is. If the median holds, you may simply have lost a few breakout posts. If the median itself is sliding, the change is more likely across the board.",
    },
    {
      type: "figure",
      image: "performance",
      alt: "The Performance tab in Threads Analytics, showing Overall Performance, Reach Growth Trend and Views Distribution charts.",
      caption:
        "The Performance tab in Threads Analytics: Overall Performance, Reach Growth Trend and Views Distribution. Shown with demo data.",
    },
    {
      type: "p",
      text: "The **Post Quality Map** is a scatter chart: each dot is one post, with views along the bottom and engagement rate up the side. Low views with a high engagement rate means the people who saw the post responded well. With few views, though, a handful of interactions can swing the rate a lot, so check the actual counts.",
    },
    {
      type: "p",
      text: "If Insights splits views by **followers and non-followers**, compare the counts, not just the percentages. A falling share can simply mean the other group grew.",
    },
    { type: "h2", text: "Testing a change you can measure" },
    {
      type: "p",
      text: "Once you have a likely cause, change one thing at a time so you know what worked. Pick a posting pace you can keep, hold topics and formats steady, and give it at least two weeks, longer if you post less often.",
    },
    {
      type: "p",
      text: "On the content side, try making the next post more useful: make the point clear, reply to thoughtful comments, and when it fits, ask a question you actually want answered rather than asking for likes. Put links where readers need them instead of hiding them because of algorithm rumours.",
    },
    {
      type: "p",
      text: "Finally, write down what you changed so you can compare it with similar posts later.",
    },
    {
      type: "callout",
      text: "Some people delete low-view posts hoping to “reset” their reach. That isn’t a known way to reset anything, and you lose data you’ll want for comparisons later. Only edit or remove a post if it contains a mistake or private information.",
    },
    { type: "h2", text: "Building your own baseline" },
    {
      type: "p",
      text: "Telling whether views really dropped depends on knowing what normal looks like, and that takes a steady record.",
    },
    {
      type: "p",
      text: "[Threads Analytics](/analytics) stores the posts and metrics the official API provides, and builds up follower history every day from your first sync. Reach Growth Trend and Views Distribution in the Performance tab, plus Content Feature Comparison and Posting Gap vs Performance in the Content tab, turn the checklist above into a few charts. The Overview summary also compares this period with the previous one, which makes it a good starting point.",
    },
    {
      type: "p",
      text: "Two caveats: the traffic source breakdown from official Insights isn’t shown in the dashboard, and if some syncs failed, keep that in mind when comparing periods.",
    },
    { type: "h2", text: "Look at the data before you conclude" },
    {
      type: "p",
      text: "When views drop, the most important thing is not to let worry get ahead of the data. Often the answer is in your post volume, content mix, rhythm or timing. If none of those explains it, check your account status and official announcements.",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "在 Threads（脆）上連續幾篇貼文的觀看都比平常低，心裡難免開始懷疑：是不是被限流了？是不是演算法又改了？",
    },
    {
      type: "p",
      text: "先別緊張。要確認有沒有受到限制，可以到 Threads 設定查看帳號狀態，這比從數字猜測可靠得多。觀看數下降的原因有很多：發文變少、內容方向變了、某個表現特別好的日子剛好移出統計區間……這些都會讓數字看起來變差，但和帳號有沒有問題無關。",
    },
    {
      type: "p",
      text: "先說明一下用詞：大家說的「觸及下降」，通常指的是觀看數變少。Threads 的觀看數算的是次數，不是看過的人數，所以這篇直接用觀看數來判斷，並用你自己的數據一個一個檢查。洞察報告裡每個數字的意思，可以參考[《Threads 洞察報告怎麼看》](/guides/threads-insights)。",
    },
    { type: "h2", text: "先⁠確⁠認是⁠真⁠的⁠下⁠降" },
    {
      type: "p",
      text: "一週表現差不代表趨勢。第一步是拿兩段一樣長的期間來比較，而且不能只看總數。有四個數字要一起看：單篇觀看的**中位數**、單篇觀看的**平均**、**總觀看**，以及**發文篇數**。",
    },
    {
      type: "p",
      text: "這四個數字放在一起，能看出很多事。下面這個例子，總觀看掉了，觸及其實沒變：",
    },
    {
      type: "table",
      head: ["", "上個月", "這個月"],
      rows: [
        ["發文篇數", "20", "12"],
        ["總觀看", "48,000", "30,000"],
        ["單篇觀看中位數", "1,800", "1,850"],
        ["單篇觀看平均", "2,400", "2,500"],
      ],
      caption: "示範資料，數字僅供說明。",
    },
    {
      type: "p",
      text: "總觀看少了將近四成，看起來很嚇人。但單篇的中位數和平均其實幾乎沒變，真正的差別只在於這個月少發了 8 篇。這種情況下，問題不在觸及，而在發文量。",
    },
    {
      type: "p",
      text: "另外還有兩種常見的假警報，也值得先排除。一種是**滾動區間**，也就是「最近 30 天」這種每天往前推一天的區間：只要某個高峰日被推出區間外，總數就會下降，即使最近的貼文表現沒變。另一種是**剛發的貼文**：最近幾天發的貼文還在累積觀看，放進來比較會讓數字偏低，先排除會比較準。",
    },
    { type: "h2", text: "五⁠個值⁠得⁠檢⁠查⁠的⁠變⁠化" },
    {
      type: "p",
      text: "如果確認真的下降了，接下來可以從這幾個方向找原因。它們都是能用數據驗證的假設，不是演算法的判決。",
    },
    { type: "h3", text: "內容格式或主題變了" },
    {
      type: "p",
      text: "比較同一種格式、同一個主題的貼文。如果你最近的內容組合改變了，例如圖片變少、文字變多，即使每種類型的表現都沒變，整體中位數還是可能移動。",
    },
    { type: "h3", text: "發文節奏變了" },
    {
      type: "p",
      text: "前面的表格看的是發文篇數，這裡看的是間隔：例如停更了一兩週，或從每天發改成集中在週末發。Threads Analytics 的「發文活動」和「發文間隔與成效」圖表可以直接看。如果停更後觀看下降，也順便檢查同一時期的主題和格式有沒有跟著變。",
    },
    { type: "h3", text: "發文時段變了" },
    {
      type: "p",
      text: "看看你是不是換了發文時段，並比較不同時段裡相似的貼文。[《Threads 最佳發文時間怎麼找》](/guides/best-time-to-post)有完整的做法。",
    },
    { type: "h3", text: "連結變多、提問變少" },
    {
      type: "p",
      text: "在相同主題和格式裡，比較有沒有附連結、有沒有提問的貼文。每個帳號的受眾反應都不一樣，你自己的數據會告訴你這對你有沒有影響。",
    },
    { type: "h3", text: "平台本身有變動" },
    {
      type: "p",
      text: "查看 Threads 的官方公告，以及設定裡的帳號狀態。如果很多帳號同時反映觀看下降，就值得關注平台是否有調整。也別忘了確認資料同步有沒有失敗。",
    },
    { type: "h2", text: "用⁠圖⁠表縮⁠小⁠範⁠圍" },
    {
      type: "p",
      text: "找到可能的方向後，可以用圖表進一步確認。以下用 Threads Analytics 的圖表舉例。",
    },
    {
      type: "p",
      text: "**觸及成長趨勢**和**觀看數分布**能看出變化出在哪裡。如果中位數持平，可能只是少了幾篇表現特別好的貼文。如果連中位數都在往下走，才比較像是整體的變化。",
    },
    {
      type: "figure",
      image: "performance",
      alt: "Threads Analytics 的成效分頁，顯示整體成效、觸及成長趨勢和觀看數分布圖表。",
      caption: "Threads Analytics 成效分頁的整體成效、觸及成長趨勢與觀看數分布。圖為示範資料。",
    },
    {
      type: "p",
      text: "**單篇品質地圖**是一張散佈圖：每個點代表一篇貼文，橫軸是觀看，縱軸是互動率。觀看低、互動率高的貼文，代表看到的人反應不錯。不過觀看很少時，幾個互動就能讓比例大幅波動，記得也看實際數字。",
    },
    {
      type: "p",
      text: "如果洞察報告有區分**追蹤者和非追蹤者**的觀看，也要看實際數字，不只看比例。某一群的占比下降，可能只是另一群變多了。",
    },
    { type: "h2", text: "測⁠試⁠一⁠個能⁠衡⁠量⁠的⁠調⁠整" },
    {
      type: "p",
      text: "找到可能的原因後，一次只調整一件事，才知道是哪個改變有效。挑一個你能持續的發文頻率，主題和格式盡量接近，至少觀察兩週。發文比較少的話，就拉長觀察時間。",
    },
    {
      type: "p",
      text: "內容上，可以試著讓下一篇對讀者更有用：把重點說清楚、回覆有內容的留言，主題適合時提出一個你真的想知道答案的問題，而不是單純要大家按讚。連結放在讀者需要的地方就好，不用為了演算法傳言把它藏起來。",
    },
    {
      type: "p",
      text: "最後，記下你改了什麼，之後才能和相似的貼文比較。",
    },
    {
      type: "callout",
      text: "有些人會把觀看低的貼文刪掉，希望「重置」觸及。這並不是已知有效的方法，反而會失去之後比較用的資料。只有內容有誤或涉及隱私時，才需要修改或刪除。",
    },
    { type: "h2", text: "建⁠立自⁠己⁠的⁠基⁠準⁠線" },
    {
      type: "p",
      text: "要判斷觀看是不是真的下降，前提是你知道「平常」長什麼樣子，這需要持續累積的紀錄。",
    },
    {
      type: "p",
      text: "[Threads Analytics](/analytics) 會保存官方 API 提供的貼文與指標，粉絲歷史則從第一次同步開始每天累積。成效分頁的「觸及成長趨勢」和「觀看數分布」，加上內容分頁的「內容特徵對照」和「發文間隔與成效」，就能把上面的檢查流程變成幾張圖表。總覽頁的摘要也會自動比較本期和上一期，很適合當作起點。",
    },
    {
      type: "p",
      text: "有兩點要注意。官方洞察報告裡的流量來源分布，儀表板不會顯示。另外，如果某幾天同步失敗，比較時也要把這點考慮進去。",
    },
    { type: "h2", text: "先⁠看⁠數⁠據⁠，再⁠下⁠結⁠論" },
    {
      type: "p",
      text: "觀看數下降時，最重要的是別讓情緒跑在數據前面。很多時候，答案就藏在發文量、內容組合、節奏和時段裡。這些都排除了還是找不到原因，再去查看帳號狀態與官方公告。",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "Threads（スレッズ）で、いつもより閲覧数の少ない投稿が何件か続くと、不安になってきます。制限されたのか。アルゴリズムが変わったのか。",
    },
    {
      type: "p",
      text: "まずは落ち着きましょう。制限されているかどうかは、数字から推測するより、Threads の設定でアカウントステータスを確認するほうが確実です。閲覧数が下がる理由はたくさんあります。投稿数が減った、発信内容が変わった、好調だった日がちょうど集計期間から外れた……。どれも数字を悪く見せますが、アカウントに問題があるわけではありません。",
    },
    {
      type: "p",
      text: "言葉についても先に整理しておきます。「リーチが落ちた」というとき、たいていは閲覧数が減ったことを指しています。Threads の閲覧数は見た人の数ではなく表示された回数なので、この記事では閲覧数を使い、自分のデータで原因を一つずつ確かめていきます。インサイトの各数字の意味は[「Threads インサイトの見方」](/guides/threads-insights)で詳しく紹介しています。",
    },
    { type: "h2", text: "ま⁠ず⁠、本⁠当⁠に⁠落⁠ち⁠た⁠の⁠か⁠を確⁠か⁠め⁠る" },
    {
      type: "p",
      text: "1週間の不調だけではトレンドとは言えません。最初にやるのは、同じ長さの二つの期間を比べることです。合計だけでなく、投稿あたりの閲覧数の**中央値**と**平均**、**総閲覧数**、**投稿数**の四つを一緒に見ます。",
    },
    {
      type: "p",
      text: "四つを並べると、多くのことがわかります。次の例では、合計の閲覧数は減っていますが、リーチ自体は変わっていません。",
    },
    {
      type: "table",
      head: ["", "先月", "今月"],
      rows: [
        ["投稿数", "20", "12"],
        ["総閲覧数", "48,000", "30,000"],
        ["投稿あたりの閲覧数の中央値", "1,800", "1,850"],
        ["投稿あたりの閲覧数の平均", "2,400", "2,500"],
      ],
      caption: "説明用のデモデータです。",
    },
    {
      type: "p",
      text: "総閲覧数は4割近く減っていて、一見すると深刻です。でも投稿あたりの中央値と平均はほとんど変わっていません。違いは、今月の投稿が8件少なかったことだけです。この場合、問題はリーチではなく投稿量にあります。",
    },
    {
      type: "p",
      text: "ほかにも、よくある「空振りの警報」が二つあります。一つは**集計期間の入れ替わり**です。直近30日のように1日ずつ後ろにずれていく集計では、ピークの日が期間から外れた途端に合計が下がります。最近の投稿の成績が変わっていなくても、です。もう一つは**公開直後の投稿**です。ここ数日の投稿はまだ閲覧が伸びている途中なので、比較から外したほうが正確です。",
    },
    { type: "h2", text: "確⁠認⁠し⁠た⁠い五⁠つ⁠の⁠変⁠化" },
    {
      type: "p",
      text: "本当に落ちているとわかったら、次の方向から原因を探します。どれもデータで検証できる仮説で、アルゴリズムの判定ではありません。",
    },
    { type: "h3", text: "形式やテーマが変わった" },
    {
      type: "p",
      text: "同じ形式・同じテーマの投稿同士で比べます。たとえば画像が減ってテキストが増えるなど、投稿の構成が変わると、種類ごとの成績が以前と同じでも全体の中央値は動きます。",
    },
    { type: "h3", text: "投稿のペースが変わった" },
    {
      type: "p",
      text: "前の表で見たのは投稿数でした。ここで見るのは間隔です。たとえば1〜2週間投稿を休んだ、毎日の投稿を週末にまとめるようになった、などです。Threads Analytics なら「投稿アクティビティ」と「投稿間隔とパフォーマンス」のグラフで見られます。休んだあとに閲覧数が落ちたなら、同じ時期にテーマや形式も変わっていないか見てみましょう。",
    },
    { type: "h3", text: "投稿時間帯が変わった" },
    {
      type: "p",
      text: "投稿する時間帯が変わっていないか確認し、時間帯ごとに似た投稿を比べます。詳しいやり方は[「Threads の最適な投稿時間」](/guides/best-time-to-post)で紹介しています。",
    },
    { type: "h3", text: "リンクが増え、問いかけが減った" },
    {
      type: "p",
      text: "同じテーマ・形式の中で、リンクの有無や質問の有無で投稿を比べます。読者の反応はアカウントごとに違うので、影響があるかどうかは自分の数字が教えてくれます。",
    },
    { type: "h3", text: "プラットフォーム側の変更" },
    {
      type: "p",
      text: "Threads の公式発表と、設定にあるアカウントステータスを確認しましょう。多くのアカウントで同時に低下が報告されているなら、プラットフォーム側の変更も注目に値します。データの同期に失敗していないかも確認しておきます。",
    },
    { type: "h2", text: "グ⁠ラ⁠フ⁠で範⁠囲⁠を⁠絞⁠る" },
    {
      type: "p",
      text: "方向性が見えたら、グラフでさらに確かめます。以下は Threads Analytics のグラフを例にしています。",
    },
    {
      type: "p",
      text: "**リーチ成長トレンド**と**ビュー数の分布**を見れば、変化がどこで起きているかがわかります。中央値が変わらないなら、特に伸びた投稿が数件減っただけかもしれません。中央値そのものが下がっているなら、全体的な変化の可能性が高くなります。",
    },
    {
      type: "figure",
      image: "performance",
      alt: "Threads Analytics のパフォーマンスタブ。全体パフォーマンス、リーチ成長トレンド、ビュー数の分布のグラフが表示されている。",
      caption:
        "Threads Analytics のパフォーマンスタブ。全体パフォーマンス、リーチ成長トレンド、ビュー数の分布。画像はデモデータです。",
    },
    {
      type: "p",
      text: "**投稿品質マップ**は散布図で、点の一つひとつが投稿です。横軸が閲覧数、縦軸がエンゲージメント率を表します。閲覧数が少なくエンゲージメント率が高いなら、見た人の反応は良かったということです。ただ閲覧が少ないと、数件の反応で率が大きく動くので、実数も確認しましょう。",
    },
    {
      type: "p",
      text: "インサイトで**フォロワーと非フォロワー**別の閲覧数が見られるなら、割合だけでなく実数も比べます。一方の割合が下がったのは、もう一方が増えただけかもしれません。",
    },
    { type: "h2", text: "効⁠果⁠を⁠測⁠れ⁠る変⁠更⁠を⁠試⁠す" },
    {
      type: "p",
      text: "原因の見当がついたら、変えるのは一度に一つだけにします。そうすれば、何が効いたのかがわかります。無理なく続けられる投稿ペースを選び、テーマや形式はなるべくそろえて、最低2週間、投稿が少なければもっと長く様子を見ましょう。",
    },
    {
      type: "p",
      text: "内容面では、次の投稿を読者にとってもっと役立つものにしてみましょう。要点をはっきりさせ、内容のあるコメントに返信し、テーマに合うときは、いいねを求めるのではなく本当に答えを知りたい質問を投げかけます。リンクはアルゴリズムの噂を気にして隠さず、読者が必要とする場所に置けば十分です。",
    },
    {
      type: "p",
      text: "最後に、何を変えたかを記録しておきましょう。あとで似た投稿と比べられます。",
    },
    {
      type: "callout",
      text: "閲覧数の少ない投稿を消してリーチを「リセット」しようとする人もいます。これは効果が確かめられた方法ではなく、あとで比較に使えるデータも失います。修正や削除は、誤りやプライバシーの問題があるときだけにしましょう。",
    },
    { type: "h2", text: "自⁠分⁠の基⁠準⁠線⁠をつ⁠く⁠る" },
    {
      type: "p",
      text: "閲覧数が本当に落ちたのかを判断するには、「いつも」がどのくらいかを知っている必要があります。そのためには、記録を積み重ねるしかありません。",
    },
    {
      type: "p",
      text: "[Threads Analytics](/analytics) は、公式 API から取得できる投稿と指標を保存し、フォロワーの履歴を最初の同期から毎日積み上げます。パフォーマンスタブの「リーチ成長トレンド」と「ビュー数の分布」、コンテンツタブの「コンテンツ特徴の比較」と「投稿間隔とパフォーマンス」を使えば、ここまでのチェックがいくつかのグラフで済みます。概要ページのサマリーは今期と前期を自動で比べてくれるので、最初の手がかりに向いています。",
    },
    {
      type: "p",
      text: "注意点が二つあります。公式インサイトの流入元の内訳はダッシュボードには表示されません。また、同期に失敗した日があれば、期間を比べるときに考慮しましょう。",
    },
    { type: "h2", text: "結⁠論⁠は⁠、デ⁠ー⁠タ⁠を見⁠て⁠か⁠ら" },
    {
      type: "p",
      text: "閲覧数が落ちたときにいちばん大切なのは、不安をデータより先走らせないことです。多くの場合、答えは投稿量、投稿内容の構成、ペース、時間帯のどこかにあります。そのどれでも説明がつかなければ、アカウントステータスと公式発表を確認しましょう。",
    },
  ],
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
