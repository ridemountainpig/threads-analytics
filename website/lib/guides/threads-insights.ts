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
  body: [
    {
      type: "p",
      text: "You publish a post you’re proud of, open Insights the next day, and the views are half of what you usually get. Was the post weak? Did the algorithm bury it? Before jumping to conclusions, it helps to know exactly what each number counts. A lot of worries disappear once you do.",
    },
    {
      type: "p",
      text: "We’ll start with where to find Insights and how account and post insights differ, then go through views, interactions, followers and traffic sources one by one. At the end, we’ll look at what Insights can’t tell you, and how to fill the gap.",
    },
    { type: "h2", text: "Where to find Insights: account vs post" },
    {
      type: "p",
      text: "Open your profile in the Threads app or on the web to find Insights. For a single post, open that post’s own insights.",
    },
    {
      type: "p",
      text: "The two views mean slightly different things. **Account insights** cover the date range you pick. **Post insights** are a running total since the post went live. Older posts keep getting seen, so adding up the views of this week’s posts usually won’t match your account’s views for the week.",
    },
    {
      type: "p",
      text: "Meta lets you compare performance over 7 to 90 days. If you want to see six months or a year, you’ll need to keep your own records. More on that at the end.",
    },
    { type: "h2", text: "Views count views, not people" },
    {
      type: "p",
      text: "Views are the number of times your post was seen. The same person can be counted more than once, so views aren’t the number of people who saw it.",
    },
    {
      type: "p",
      text: "If Insights splits views into followers and non-followers, that split is worth a look. The higher the non-follower share, the further the post travelled beyond people who already know you.",
    },
    {
      type: "callout",
      text: "A single number rarely tells you whether a post did well. Compare it with your own usual results instead. A post at twice your recent median says more than “3,000 views” on its own.",
    },
    { type: "h2", text: "Interactions: read each type on its own" },
    {
      type: "p",
      text: "Meta counts likes, replies, reposts and quotes as interactions. They don’t carry the same weight: a like takes a second, while a reply means someone stopped to think. If conversation is what you’re after, look at replies separately.",
    },
    {
      type: "p",
      text: "Many people also track an engagement rate. Threads Analytics calculates it as **(likes + replies + reposts + quotes) ÷ views**, with shares counted separately. Other tools may use a different formula, so check before comparing numbers across tools.",
    },
    {
      type: "p",
      text: "One trap to watch for: a higher engagement rate isn’t always good news. If views drop sharply while interactions stay the same, the rate goes up too. Whenever you look at a ratio, glance at both the top and bottom numbers.",
    },
    { type: "h2", text: "Followers: growth and composition" },
    {
      type: "p",
      text: "Follower count tells you whether your audience is growing. Insights can also break followers down by country, city, age and gender, which helps you check whether your real readers match the audience you had in mind.",
    },
    {
      type: "p",
      text: "Demographics need a minimum audience before they appear. Through the API, the threshold is 100 followers, so an empty chart on a smaller account is normal.",
    },
    { type: "h2", text: "Traffic sources tell you where, not why" },
    {
      type: "p",
      text: "Insights groups views by source, such as Home, Profile, Search and Other. Home is the feed, Profile is people visiting your profile, and Search is views from search results. Meta also notes that eligible posts can be discovered on Instagram and Facebook.",
    },
    {
      type: "p",
      text: "Search doesn’t show what people typed, so a bigger Search share doesn’t necessarily mean more people are looking you up by name. And always read shares next to the actual counts. If Home views fall sharply, Search’s share rises even when its views haven’t changed at all.",
    },
    { type: "h2", text: "When the numbers look off" },
    {
      type: "p",
      text: "If you can’t find Insights, make sure you’re on the right account, update the app and try the web version. If it’s still missing, check the Help Center in the app.",
    },
    {
      type: "p",
      text: "If the numbers are lower than expected, don’t rush to a verdict. Insights isn’t always real-time, and a new post may still be collecting views. Rolling ranges are another common cause: a range like the last 7 days drops its oldest day every day, so if a strong day just fell out, the total drops even though nothing changed.",
    },
    {
      type: "p",
      text: "If you think your reach really has dropped, [Why Threads reach drops](/guides/reach-drop) has a fuller checklist.",
    },
    { type: "h2", text: "What Insights can’t tell you" },
    {
      type: "p",
      text: "Insights is good at telling you what happened. It’s less helpful with why, or what to do next. Which hour works best for you, whether images beat text, how long posts compare with short ones: answering these means grouping many posts and comparing them. [Best time to post on Threads](/guides/best-time-to-post) walks through it for posting times.",
    },
    {
      type: "p",
      text: "Time is the other limit. Insights compares at most 90 days, and past daily follower counts can’t be recovered once missed. The only way to see long-term trends is to start recording now.",
    },
    {
      type: "figure",
      image: "audience",
      alt: "The Audience tab in Threads Analytics, showing a follower growth chart and demographics by country and city.",
      caption:
        "The Audience tab in Threads Analytics saves your follower count and demographics every day. Shown with demo data.",
    },
    {
      type: "p",
      text: "That’s the gap [Threads Analytics](/analytics) fills. It’s a free, open-source Threads analytics dashboard you host yourself. It syncs your posts and metrics through the official API, saves a daily follower and demographic snapshot, and groups your posts by time, format and length automatically. The software is free; you only pay for your own hosting and database.",
    },
    {
      type: "p",
      text: "Older posts can be synced at any time, but daily follower history starts from your first sync. Earlier days can’t be filled in, so the sooner you start, the better.",
    },
    { type: "h2", text: "Compare against yourself" },
    {
      type: "p",
      text: "The numbers in Insights aren’t hard to understand. The hard part is not reading too much into them. Remember that views count views, that interactions are worth reading type by type, and that traffic sources only tell you where people came from. Compare against your own past results rather than other accounts, and Insights becomes a lot more useful.",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "在 Threads（脆）發了一篇自己很滿意的貼文，隔天打開洞察報告，瀏覽次數卻只有平常的一半。是內容不夠好？還是被限流了？在急著下結論之前，先搞清楚這些數字到底在算什麼，很多疑問其實就會自己消失。",
    },
    {
      type: "p",
      text: "這篇會先講去哪裡看，以及帳號洞察和單篇洞察的差別，接著逐一說明瀏覽次數、互動、粉絲和流量來源。最後再聊聊洞察報告做不到的事，以及可以怎麼補上。",
    },
    { type: "h2", text: "去⁠哪⁠裡⁠看⁠：帳⁠號⁠洞⁠察和⁠單⁠篇⁠洞⁠察" },
    {
      type: "p",
      text: "在 Threads App 或網頁版進入自己的個人檔案，就能找到洞察報告。想看某一篇的表現，則是打開那篇貼文的洞察。",
    },
    {
      type: "p",
      text: "這兩個地方的數字，意義不太一樣。**帳號洞察**呈現的是你選的日期區間內的表現，**單篇貼文**的數字則是發布到現在的累計。舊貼文也會持續被看到，所以把這週發的貼文瀏覽次數加起來，通常不會等於帳號這週的總瀏覽。",
    },
    {
      type: "p",
      text: "日期區間方面，Meta 提供 7 到 90 天的比較。想看半年、一年的長期趨勢，就得自己另外留紀錄，這點文章最後會再提到。",
    },
    { type: "h2", text: "瀏⁠覽⁠次⁠數⁠：算⁠的⁠是⁠次⁠數⁠，不⁠是⁠人⁠數" },
    {
      type: "p",
      text: "瀏覽次數是貼文被看到的次數。同一個人可能被算不只一次，所以它不等於看過的人數。",
    },
    {
      type: "p",
      text: "如果報告有區分追蹤者和非追蹤者，這個比例很值得看。非追蹤者的比例越高，代表這篇貼文觸及到越多原本不認識你的人。",
    },
    {
      type: "callout",
      text: "想知道一篇貼文表現好不好，與其看單一數字，不如和自己平常的表現比。例如某篇的瀏覽是你近期中位數的兩倍，就比單看「3,000 次瀏覽」更有意義。",
    },
    { type: "h2", text: "互⁠動⁠：讚⁠、⁠回⁠覆⁠、⁠轉⁠發⁠、⁠引⁠用要⁠分⁠開⁠看" },
    {
      type: "p",
      text: "Meta 把讚、回覆、轉發和引用算作互動。這四種反應的份量其實不太一樣：按讚只需要一秒，回覆則代表對方停下來想了一下。如果你在意的是討論度，就該把回覆單獨拿出來看。",
    },
    {
      type: "p",
      text: "很多人還會再算一個互動率。Threads Analytics 的算法是 **（讚 + 回覆 + 轉發 + 引用）÷ 瀏覽次數**，分享另外計算。不同工具的公式不一定一樣，拿別人的數字來比之前，先確認算法相同。",
    },
    {
      type: "p",
      text: "還有一個常見的陷阱：互動率變高，不一定是好事。如果瀏覽次數大幅下降、互動數沒變，互動率也會跟著上升。看比例的時候，記得把分子和分母都看一眼。",
    },
    { type: "h2", text: "粉⁠絲⁠：看⁠成⁠長⁠，也⁠看⁠組⁠成" },
    {
      type: "p",
      text: "粉絲數反映受眾有沒有在成長。除了總數，洞察報告還能依國家、城市、年齡、性別拆分粉絲，幫你確認實際的讀者，和你想像中的是不是同一群人。",
    },
    {
      type: "p",
      text: "人口統計資料要等帳號有一定的粉絲數才會出現。透過 API 取得時，門檻是 100 位粉絲，所以小帳號的圖表是空的也很正常。",
    },
    { type: "h2", text: "流⁠量⁠來⁠源⁠：知⁠道⁠從⁠哪⁠裡⁠來⁠，但⁠不⁠知⁠道⁠為⁠什⁠麼" },
    {
      type: "p",
      text: "洞察報告會把瀏覽依來源分類，常見的有首頁、個人檔案、搜尋和其他。首頁是動態消息，個人檔案是有人點進你的主頁，搜尋則是從搜尋結果看到。Meta 也提到，符合條件的貼文可能會出現在 Instagram 和 Facebook。",
    },
    {
      type: "p",
      text: "「搜尋」不會告訴你對方搜了什麼，所以占比變高，不代表更多人在搜尋你的名字。比例也一定要搭配實際數字看。假設首頁的瀏覽大幅下滑，搜尋的瀏覽數就算完全沒變，占比也會上升。",
    },
    { type: "h2", text: "數⁠字⁠看⁠起⁠來怪⁠怪⁠的⁠時⁠候" },
    {
      type: "p",
      text: "找不到洞察報告的話，先確認登入的是正確帳號、把 App 更新到最新版，再試試網頁版。還是找不到，可以查看 App 內的說明中心。",
    },
    {
      type: "p",
      text: "數字比預期低時，先別急著下結論。洞察報告不一定即時更新，剛發的貼文也可能還在累積瀏覽。另一個常見原因是滾動區間：像「最近 7 天」這種區間，每天都會移出最舊的一天。如果表現特別好的那天剛好被移出，總數就會下降，但其實什麼都沒變。",
    },
    {
      type: "p",
      text: "如果你擔心觸及真的掉了，可以參考[《Threads 觸及率下降怎麼辦》](/guides/reach-drop)，裡面有更完整的檢查步驟。",
    },
    { type: "h2", text: "洞⁠察⁠報⁠告做⁠不⁠到⁠的⁠事" },
    {
      type: "p",
      text: "洞察報告擅長告訴你「發生了什麼」，但不太能回答「為什麼」和「接下來該怎麼做」。哪個時段發文效果最好？圖片和純文字哪種比較穩？長文和短文差多少？這些都要把很多篇貼文分組比較，才看得出來。以發文時段為例，做法可以參考[《Threads 最佳發文時間怎麼找》](/guides/best-time-to-post)。",
    },
    {
      type: "p",
      text: "另一個限制是時間。洞察報告最多只能比較 90 天，而過去每一天的粉絲數，錯過就補不回來。想看長期趨勢，唯一的方法是從現在開始持續記錄。",
    },
    {
      type: "figure",
      image: "audience",
      alt: "Threads Analytics 的受眾分頁，顯示粉絲成長曲線，以及依國家和城市拆分的粉絲組成。",
      caption: "Threads Analytics 的受眾分頁會每天保存粉絲數與組成。圖為示範資料。",
    },
    {
      type: "p",
      text: "[Threads Analytics](/analytics) 就是用來補上這一塊的工具。它是免費開源、可以自己架設的 Threads 數據分析儀表板，會透過官方 API 同步你的貼文與指標，每天保存粉絲與人口統計快照，並自動依發文時間、格式和長度幫你分組比較。軟體本身免費，只需要負擔自己的主機與資料庫費用。",
    },
    {
      type: "p",
      text: "舊貼文隨時都能同步，但粉絲的每日紀錄是從第一次同步開始累積，之前的日子一樣補不回來。所以越早開始記錄越好。",
    },
    { type: "h2", text: "和⁠自⁠己⁠比⁠，數⁠字才⁠有⁠意⁠義" },
    {
      type: "p",
      text: "洞察報告的數字不難懂，難的是別過度解讀。記得瀏覽算的是次數、互動要分開看、流量來源只告訴你從哪裡來。把數字拿來和自己過去的表現比，而不是和別人比，洞察報告就會變得有用得多。",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "Threads（スレッズ）で自信のある投稿をしたのに、翌日インサイトを開いたら閲覧数がいつもの半分。内容がいまいちだった？それとも制限された？結論を急ぐ前に、それぞれの数字が何を数えているのかを知っておくと、多くの不安はそれだけで解消します。",
    },
    {
      type: "p",
      text: "この記事では、インサイトの開き方と、アカウントと投稿のインサイトの違いから始めて、閲覧数、インタラクション、フォロワー、流入元を順に見ていきます。最後に、インサイトではわからないことと、その補い方を紹介します。",
    },
    { type: "h2", text: "イ⁠ン⁠サ⁠イ⁠ト⁠の開⁠き⁠方⁠：ア⁠カ⁠ウ⁠ン⁠ト⁠と投⁠稿" },
    {
      type: "p",
      text: "Threads アプリかウェブ版でプロフィールを開くと、インサイトが見つかります。1件ごとの成績は、その投稿のインサイトから確認できます。",
    },
    {
      type: "p",
      text: "この二つの数字は意味が少し違います。**アカウントのインサイト**は選んだ期間の成績、**投稿のインサイト**は公開してからの累計です。古い投稿も見られ続けるので、今週公開した投稿の閲覧数を足しても、今週のアカウント全体の閲覧数とはたいてい一致しません。",
    },
    {
      type: "p",
      text: "期間については、Meta は7〜90日の比較を用意しています。半年や1年の推移を見たいなら、自分で記録を残す必要があります。これは記事の最後でも触れます。",
    },
    { type: "h2", text: "閲⁠覧⁠数⁠は「⁠人⁠数⁠」⁠で⁠は⁠な⁠く「⁠回⁠数⁠」" },
    {
      type: "p",
      text: "閲覧数は投稿が表示された回数です。同じ人が複数回カウントされることもあるので、見た人の数とは一致しません。",
    },
    {
      type: "p",
      text: "フォロワーと非フォロワーの内訳が見られるなら、ぜひ確認しましょう。非フォロワーの割合が高いほど、あなたをまだ知らない人にまで投稿が届いたことになります。",
    },
    {
      type: "callout",
      text: "投稿の成績は、単独の数字より自分のいつもの成績と比べたほうがわかりやすくなります。「3,000回表示」だけより、「最近の中央値の2倍」のほうがずっと意味があります。",
    },
    { type: "h2", text: "イ⁠ン⁠タ⁠ラ⁠ク⁠シ⁠ョ⁠ン⁠は種⁠類⁠ご⁠と⁠に⁠見⁠る" },
    {
      type: "p",
      text: "Meta はいいね・返信・再投稿・引用をインタラクションとして数えます。ただ、この四つの重みは同じではありません。いいねは一瞬でできますが、返信は相手が少し考えてくれた証です。会話を重視するなら、返信だけを取り出して見ましょう。",
    },
    {
      type: "p",
      text: "エンゲージメント率を計算する人も多いでしょう。Threads Analytics では **（いいね＋返信＋再投稿＋引用）÷ 閲覧数** で計算し、シェアは別に集計します。ツールによって計算式が違うので、他の数字と比べる前に確認しておきましょう。",
    },
    {
      type: "p",
      text: "よくある落とし穴もあります。エンゲージメント率が上がっても、良い知らせとは限りません。閲覧数が大きく減って反応の数が変わらなければ、率は上がります。割合を見るときは、分子と分母の両方を確認しましょう。",
    },
    { type: "h2", text: "フ⁠ォ⁠ロ⁠ワ⁠ー⁠は増⁠え⁠方⁠と構⁠成⁠を⁠見⁠る" },
    {
      type: "p",
      text: "フォロワー数は、オーディエンスが育っているかどうかを表します。インサイトでは国・都市・年齢・性別の内訳も見られるので、実際の読者が想定どおりの層かどうかを確かめられます。",
    },
    {
      type: "p",
      text: "属性データは、ある程度のフォロワー数がないと表示されません。API 経由の場合は100人以上が条件なので、小さなアカウントでグラフが空でも心配はいりません。",
    },
    { type: "h2", text: "流⁠入⁠元⁠でわ⁠か⁠る⁠の⁠は「⁠ど⁠こ⁠か⁠ら⁠」⁠だ⁠け" },
    {
      type: "p",
      text: "インサイトでは閲覧を流入元ごとに分類します。代表的なのはホーム、プロフィール、検索、その他です。ホームはフィード、プロフィールはプロフィールを訪れた人、検索は検索結果からの閲覧です。Meta によると、条件を満たす投稿は Instagram や Facebook でも表示されることがあります。",
    },
    {
      type: "p",
      text: "「検索」からは何が検索されたかはわからないので、割合が増えても、あなたの名前で検索する人が増えたとは限りません。割合は必ず実数と一緒に見ましょう。ホームからの閲覧が大きく減れば、検索の閲覧数がまったく変わらなくても割合は上がります。",
    },
    { type: "h2", text: "数⁠字⁠がお⁠か⁠し⁠い⁠と感⁠じ⁠た⁠ら" },
    {
      type: "p",
      text: "インサイトが見つからないときは、正しいアカウントでログインしているか確認し、アプリを最新版に更新して、ウェブ版でも見てみましょう。それでも見つからなければ、アプリ内のヘルプセンターを確認します。",
    },
    {
      type: "p",
      text: "数字が思ったより低くても、結論を急がないでください。インサイトは常にリアルタイムとは限らず、公開直後の投稿はまだ閲覧が伸びている途中かもしれません。直近7日のような集計期間もよくある原因です。毎日いちばん古い日が外れていくので、好調だった日が外れれば、何も変わっていなくても合計は下がります。",
    },
    {
      type: "p",
      text: "本当にリーチが落ちたのか気になるなら、[「Threads のリーチが落ちたとき」](/guides/reach-drop)で確認の手順を詳しく紹介しています。",
    },
    { type: "h2", text: "イ⁠ン⁠サ⁠イ⁠ト⁠で⁠はわ⁠か⁠ら⁠な⁠い⁠こ⁠と" },
    {
      type: "p",
      text: "インサイトが得意なのは「何が起きたか」を伝えることです。「なぜ」や「次に何をすべきか」にはあまり答えてくれません。どの時間帯の投稿が伸びるのか、画像とテキストのどちらが安定しているのか、長文と短文でどれくらい違うのか。こうした疑問に答えるには、多くの投稿をグループ分けして比べる必要があります。投稿時間帯を例にしたやり方は[「Threads の最適な投稿時間」](/guides/best-time-to-post)で紹介しています。",
    },
    {
      type: "p",
      text: "もう一つの制約は期間です。インサイトで比較できるのは最大90日で、過去の日ごとのフォロワー数は取り逃すと戻りません。長期の推移を見る方法は、今から記録を続けることだけです。",
    },
    {
      type: "figure",
      image: "audience",
      alt: "Threads Analytics のオーディエンスタブ。フォロワー数の推移と、国・都市別のフォロワー構成が表示されている。",
      caption:
        "Threads Analytics のオーディエンスタブでは、フォロワー数と構成を毎日保存します。画像はデモデータです。",
    },
    {
      type: "p",
      text: "その部分を補うのが [Threads Analytics](/analytics) です。自分でホストできる無料・オープンソースの Threads 分析ダッシュボードで、公式 API から投稿と指標を同期し、フォロワーと属性のスナップショットを毎日保存し、投稿時間・形式・長さ別の集計を自動で行います。ソフトウェアは無料で、かかるのはホスティングとデータベースの費用だけです。",
    },
    {
      type: "p",
      text: "過去の投稿はいつでも同期できますが、フォロワーの日ごとの記録は最初の同期から始まり、それ以前の日は埋められません。始めるなら早いほうがいいでしょう。",
    },
    { type: "h2", text: "比⁠べ⁠る⁠相⁠手⁠は⁠、過⁠去⁠の⁠自⁠分" },
    {
      type: "p",
      text: "インサイトの数字自体は難しくありません。難しいのは、読み取りすぎないことです。閲覧数は回数であること、インタラクションは種類ごとに見ること、流入元は「どこから」しか教えてくれないこと。他のアカウントではなく自分の過去の成績と比べれば、インサイトはずっと役に立つようになります。",
    },
  ],
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
