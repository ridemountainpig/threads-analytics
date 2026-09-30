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
  body: [
    {
      type: "p",
      text: "“What time should I post on Threads?” is one of the first questions people ask when they start taking the platform seriously.",
    },
    {
      type: "p",
      text: "You can find plenty of answers online: 8 am, noon, 9 pm. But those answers come from other people’s audiences. Where your readers live, when they finish work and when they scroll all change the answer. Rather than borrowing someone else’s schedule, look for it in your own posts.",
    },
    { type: "h2", text: "Why there’s no standard answer" },
    {
      type: "p",
      text: "Posting time is only one of the things that affect a post. The topic, the format and whatever else is trending that day can matter just as much. Comparing the timing of two posts on completely different topics won’t tell you much.",
    },
    {
      type: "p",
      text: "There’s also a detail that’s easy to miss: a post’s view count is a running total. A 9 am post that did well may have picked up most of its views in the evening, which doesn’t mean your readers are online at 9 am. [Threads Insights explained](/guides/threads-insights) covers what each number counts.",
    },
    {
      type: "p",
      text: "For the same reason, a post from an hour ago hasn’t finished collecting views, so it isn’t a fair match for one that’s been up for days. When you gather your data, leave out posts from roughly the past week.",
    },
    { type: "h2", text: "Finding candidate hours in three steps" },
    {
      type: "p",
      text: "All you need is a few months of posts that reflect what you publish now, with each post’s time, views, format and topic.",
    },
    {
      type: "p",
      text: "The data can only speak for hours you’ve actually posted at. If you have only a couple dozen posts, or almost always post at the same time, there isn’t enough to compare yet. Skip ahead to testing: pick two hours you can keep up with, and the test itself will build the data.",
    },
    { type: "h3", text: "Group by hour and compare medians" },
    {
      type: "p",
      text: "Group posts by the hour they went out, then compare the **median** of each group rather than the average. One viral post can drag the average way up; the median shows what a typical post at that hour does.",
    },
    { type: "p", text: "Say your posts come out like this:" },
    {
      type: "table",
      head: ["Posting hour", "Posts", "Median views", "Average views"],
      rows: [
        ["8 am", "12", "1,200", "1,350"],
        ["12 pm", "3", "2,800", "6,400"],
        ["9 pm", "15", "1,900", "2,100"],
      ],
      caption: "Demo data for illustration.",
    },
    {
      type: "p",
      text: "Going by averages, noon wins by a mile. But it has only three posts, and its average is more than double its median, which suggests one viral post is doing the heavy lifting. 9 pm has fifteen posts behind it and a median consistently above the morning’s. That’s the candidate worth trusting.",
    },
    { type: "h3", text: "Check the sample size, and don’t trust first place" },
    {
      type: "p",
      text: "The example also shows why sample size matters. An hour with two or three posts is a hint, not a pattern. A quick test: remove the single best post and see whether the lead survives. If it disappears, it wasn’t really a lead.",
    },
    {
      type: "p",
      text: "There’s a subtler trap too. Line up 24 hours and one of them will come out on top even if posting time made no difference at all. It’s like having 24 people each roll a die a few times: someone will end up with a high average, but that doesn’t make them better at rolling, and their next round will usually look ordinary. The more slots you compare, the more likely first place is partly luck. That’s why this step gives you candidates, not an answer, and the alternating test at the end is what confirms them.",
    },
    { type: "h3", text: "Then add the weekday" },
    {
      type: "p",
      text: "Once you have candidate hours, compare weekdays too. Splitting by both weekday and hour spreads your posts thin, though. Thirty posts across 7 days and 24 hours leaves most slots with one or two, and with 168 slots, some will look great by chance alone. Treat thin groups as ideas to test, not conclusions.",
    },
    { type: "h2", text: "Easy ways to misread the data" },
    {
      type: "p",
      text: "**Judging by one hit.** One viral post doesn’t make an hour good. Look at the median and spread of everything else you posted at that time.",
    },
    {
      type: "p",
      text: "**Mixing formats and topics.** If your image posts go out at noon and your text posts at night, you can’t tell whether the difference comes from the format or the hour. Compare one format at a time across hours.",
    },
    {
      type: "p",
      text: "**Mixing up time zones.** Check which time zone your chart uses and stick with it. Also remember that older posts have had longer to collect views, and you had fewer followers back then.",
    },
    { type: "h2", text: "Testing a new posting time" },
    {
      type: "p",
      text: "With two candidate hours, put them head to head. A fair test needs two things: posts that can be compared, and the same mix of days for both hours.",
    },
    {
      type: "p",
      text: "**Comparable posts** means your usual kind of post: the same format (text only, image or video) and the kind of topic you write most. Leave out posts that would stand out anyway, such as giveaways, collaborations or takes on breaking news. If your account posts a bit of everything, don’t force the topics to match. Alternating evenly spreads your mix across both hours; just note the unusual posts and leave them out when you compare.",
    },
    {
      type: "p",
      text: "**Alternating** is simple: one post at hour A today, one at hour B tomorrow, and keep switching. Because a week has seven days, two weeks of alternating gives each hour every weekday once.",
    },
    {
      type: "p",
      text: "You don’t need to write down numbers 24 hours after each post. Since the two hours take turns, both groups have posts of similar ages. Wait until the last test post has been up for about a week and its views have settled, then compare the median views of the two groups. It’s the same rule as leaving out the past week when you gathered older posts: compare numbers that have mostly finished growing.",
    },
    {
      type: "p",
      text: "Two weeks gives each hour about seven posts. If the medians are close, or the gap vanishes when you remove each group’s best post, call it a tie: keep testing, or pick the hour that’s easier for you to keep up. It also helps to look at each week separately. An hour that wins both weeks is more convincing than one that wins big once.",
    },
    {
      type: "p",
      text: "If one hour clearly wins, make it your main posting time. Audiences shift with seasons, school terms and your own content, so repeat the comparison every two or three months.",
    },
    { type: "h2", text: "Where each step lives in Threads Analytics" },
    {
      type: "p",
      text: "Every step above works in a spreadsheet. If you use [Threads Analytics](/analytics), it calculates them from your synced posts, and each one has a chart:",
    },
    {
      type: "ul",
      items: [
        "**Best hours to post**, a card on the Overview page showing your top three hours by median views, with post counts and confidence labels. Hours with at least 3 posts are ranked first. Treat it as the shortlist for your test, not the verdict.",
        "**Best Time to Post**, an hourly bar chart in the Performance tab you can filter by weekday. After a test, set the date range to the test period to compare the two hours’ medians directly.",
        "**Best Day of Week**, comparing median views, engagement rate and post count by weekday.",
        "**Content Type by Time Slot**, in the Content tab, showing how each format does at each hour.",
      ],
    },
    {
      type: "callout",
      text: "Confidence labels come from post count alone: low under 3 posts, medium 3–9, high 10 or more. They aren’t a statistical test, and they can’t remove the luck of picking the top hour out of many. That’s why the last step is always a real test.",
    },
    { type: "h2", text: "Your best time is in your own data" },
    {
      type: "p",
      text: "There’s no standard best time to post, but there is a standard way to find yours: group your own posts, check medians and sample sizes to pick candidates, then run a fair, alternating test. The data suggests; the test confirms. An hour found this way fits your audience, not someone else’s.",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "「Threads 幾點發文最好？」這是很多人開始認真經營 Threads（脆）時，最先想問的問題。",
    },
    {
      type: "p",
      text: "網路上可以找到很多答案：早上八點、中午十二點、晚上九點……但這些建議都來自別人的受眾。你的讀者住在哪裡、幾點下班、什麼時候滑手機，都會影響答案。與其套用別人的時間表，不如直接從自己的貼文紀錄裡找。",
    },
    { type: "h2", text: "為⁠什⁠麼沒⁠有標⁠準⁠答⁠案" },
    {
      type: "p",
      text: "發文時間只是影響表現的因素之一。主題、格式、當天有沒有熱門話題，影響可能都跟時間一樣大。拿兩篇主題完全不同的貼文來比較發文時間，很難得出什麼結論。",
    },
    {
      type: "p",
      text: "還有一個容易忽略的地方：貼文的瀏覽數是累計值。早上九點發的貼文表現很好，瀏覽可能大多是晚上才累積的，不代表你的讀者早上九點都在線上。各項數字怎麼算，可以參考[《Threads 洞察報告怎麼看》](/guides/threads-insights)。",
    },
    {
      type: "p",
      text: "同樣的道理，剛發一小時的貼文還沒累積完瀏覽，拿來和發了好幾天的貼文比並不公平。整理數據時，先把最近一週左右的貼文排除。",
    },
    { type: "h2", text: "用⁠三⁠個⁠步⁠驟找⁠出候⁠選⁠時⁠段" },
    {
      type: "p",
      text: "你只需要最近幾個月、能代表你現在內容方向的貼文，記下每篇的發文時間、瀏覽數、格式和主題。",
    },
    {
      type: "p",
      text: "要注意，數據只能告訴你「你真的發過的時段」表現如何。如果貼文只有二三十篇，或幾乎都在同一個時間發，能比較的東西還不多。這時候可以直接跳到最後的測試：挑兩個你能持續的時段輪流發，測試本身就會幫你累積資料。",
    },
    { type: "h3", text: "先按小時分組，比較中位數" },
    {
      type: "p",
      text: "把貼文依發文的小時分組，然後比較每組的**中位數**，而不是平均。原因很簡單：一篇爆文就能把平均拉得很高，中位數則比較能反映那個時段一般貼文的表現。",
    },
    { type: "p", text: "舉個例子，假設你的貼文整理起來是這樣：" },
    {
      type: "table",
      head: ["發文時段", "貼文篇數", "瀏覽中位數", "瀏覽平均"],
      rows: [
        ["早上 8 點", "12", "1,200", "1,350"],
        ["中午 12 點", "3", "2,800", "6,400"],
        ["晚上 9 點", "15", "1,900", "2,100"],
      ],
      caption: "示範資料，數字僅供說明。",
    },
    {
      type: "p",
      text: "只看平均，中午 12 點遙遙領先。但它只有 3 篇，平均又比中位數高出一倍多，很可能是被一篇爆文拉上去的。晚上 9 點有 15 篇貼文撐著，中位數也穩定比早上高，這才是比較值得相信的候選時段。",
    },
    { type: "h3", text: "確認樣本數，也別太相信第一名" },
    {
      type: "p",
      text: "上面的例子也說明了樣本數有多重要。只有兩三篇的時段只能算線索，還稱不上規律。有個簡單的檢查方法：拿掉表現最好的那一篇，看優勢還在不在。如果優勢一下就消失，那它其實不算優勢。",
    },
    {
      type: "p",
      text: "還有一個比較不明顯的陷阱：把 24 個小時排在一起比，就算發文時間完全沒有影響，也一定會有一個時段排第一。這就像讓 24 個人各擲幾次骰子，總會有人的平均點數特別高，但那不代表他比較會擲骰子，再擲一輪通常就回到一般水準。比較的時段越多，第一名就越可能有一部分只是運氣。所以這一步找到的是「候選」，不是答案，要用文章最後的輪流測試來確認。",
    },
    { type: "h3", text: "最後加上星期幾" },
    {
      type: "p",
      text: "找到候選時段後，可以再比較星期幾。只是同時按星期和小時拆分，每組的貼文會變得很少。例如 30 篇貼文分到 7 天 × 24 小時，大部分格子都只剩一兩篇；格子多達 168 個，光靠運氣就會有幾格看起來特別好。這時候把樣本少的組別當成待測試的想法就好，不要急著下結論。",
    },
    { type: "h2", text: "比⁠較⁠時容⁠易⁠踩⁠的⁠坑" },
    {
      type: "p",
      text: "**只看一篇爆文。**一篇爆文不代表那個時段就好，要看同時段其他貼文的中位數和分布。",
    },
    {
      type: "p",
      text: "**把格式和主題混在一起。**如果你習慣中午發圖片、晚上發文字，差異到底來自格式還是時段就分不清了。一次只拿同一種格式來比較不同時段就好。",
    },
    {
      type: "p",
      text: "**時區搞混。**先確認圖表用的是哪個時區，並固定使用同一個。另外，舊貼文累積瀏覽的時間比較長，你當時的粉絲數也和現在不同，比較時要一併考慮。",
    },
    { type: "h2", text: "實⁠際⁠測⁠試新⁠的⁠發⁠文⁠時⁠段" },
    {
      type: "p",
      text: "挑出兩個候選時段後，就讓它們正面比一次。要比得公平，重點有兩個：貼文要能互相比較，兩個時段也要分到一樣的日子。",
    },
    {
      type: "p",
      text: "**貼文要能互相比較**，指的是你平常最常發的那一類：格式相同（純文字、圖片或影片），主題也是你最常寫的類型。抽獎、合作貼文、搭熱門話題的貼文本來就容易特別突出，先排除在外。如果你的帳號什麼都發一點，不必硬把主題對齊，只要確實輪流，各類內容自然會平均分到兩個時段；把特別的貼文記下來，比較時拿掉就好。",
    },
    {
      type: "p",
      text: "**輪流發**的做法很簡單：今天在時段 A 發一篇，明天在時段 B 發一篇，一直交替下去。一週有七天，連續交替兩週，每個星期幾都會輪到兩個時段各一次。",
    },
    {
      type: "p",
      text: "不需要在每篇發文 24 小時後手動記數字。因為兩個時段是交替發的，兩組貼文的新舊程度差不多。等最後一篇測試貼文發出約一週、瀏覽大致穩定後，再比較兩組的瀏覽中位數就好。這和前面整理舊貼文時先排除最近一週是同一個道理：比的都是已經累積得差不多的數字。",
    },
    {
      type: "p",
      text: "兩週下來，每個時段大約有七篇。如果兩組的中位數很接近，或拿掉各組最好的一篇後差距就消失，就當作平手：可以繼續測，或直接選你比較容易維持的那個。也可以把兩週分開看，同一個時段兩週都贏，會比只贏一次、贏很多更有說服力。",
    },
    {
      type: "p",
      text: "如果某個時段明顯勝出，就把它當成主要發文時間。受眾會隨季節、學期和你的內容改變，建議每兩三個月重新比較一次。",
    },
    { type: "h2", text: "在 T⁠h⁠r⁠e⁠a⁠d⁠s A⁠n⁠a⁠l⁠y⁠t⁠i⁠c⁠s 裡⁠怎⁠麼⁠看" },
    {
      type: "p",
      text: "上面每一步都可以用試算表完成。如果你用的是 [Threads Analytics](/analytics)，它會用同步下來的貼文自動算好，每一步都有對應的圖表：",
    },
    {
      type: "ul",
      items: [
        "**最佳發文時段**：總覽頁的卡片，列出觀看中位數最高的三個小時，並標示篇數與可信度，至少 3 篇的時段會優先列入。把它當成測試的候選名單，不是結論。",
        "**最佳發文時間**：成效分頁的逐小時長條圖，可以依星期篩選。測試結束後，把日期範圍設成測試期間，就能直接比較兩個時段的中位數。",
        "**最佳星期**：比較各星期的觀看中位數、互動率與發文數。",
        "**內容類型 × 發文時段**：在內容分頁裡，比較不同格式在各時段的表現。",
      ],
    },
    {
      type: "callout",
      text: "可信度只看篇數：少於 3 篇為低、3 到 9 篇為中、10 篇以上為高。它不是統計檢定，也沒辦法扣掉「從很多時段裡挑第一名」帶來的運氣，所以最後一步永遠是實際測試。",
    },
    { type: "h2", text: "你⁠的⁠最⁠佳⁠時⁠間⁠，只⁠能⁠從自⁠己⁠的⁠數⁠據⁠裡⁠找" },
    {
      type: "p",
      text: "最佳發文時間沒有標準答案，但有標準做法：用自己的數據分組，看中位數和樣本數挑出候選時段，再用公平的輪流測試確認。數據負責提出候選，測試負責確認。比起追逐別人的時間表，這樣找出來的時段，才真正屬於你的受眾。",
    },
  ],
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
  body: [
    {
      type: "p",
      text: "「Threads は何時に投稿するのがいいの？」。本格的に Threads（スレッズ）を運用しはじめると、多くの人がまずこの疑問にぶつかります。",
    },
    {
      type: "p",
      text: "ネットで探せば答えはたくさん見つかります。朝8時、昼12時、夜9時……。ただ、それらは他の人の読者から導かれた答えです。あなたの読者がどこに住み、何時に仕事を終え、いつスマホを見るかで答えは変わります。他人のスケジュールを借りるより、自分の投稿から探すほうが確実です。",
    },
    { type: "h2", text: "決⁠ま⁠っ⁠た⁠答⁠え⁠がな⁠い⁠理⁠由" },
    {
      type: "p",
      text: "投稿時間は、成績を左右する要因の一つにすぎません。テーマや形式、その日に話題になっていることも同じくらい影響します。テーマがまったく違う二つの投稿で時間を比べても、あまり参考になりません。",
    },
    {
      type: "p",
      text: "見落としがちな点もあります。投稿の閲覧数は累計です。朝9時の投稿が伸びていても、閲覧の多くは夜に集まったのかもしれず、読者が朝9時にオンラインだったとは限りません。各数字が何を数えているかは[「Threads インサイトの見方」](/guides/threads-insights)で解説しています。",
    },
    {
      type: "p",
      text: "同じ理由で、公開から1時間の投稿はまだ閲覧を集めきっておらず、数日たった投稿と比べるのは公平ではありません。データをまとめるときは、直近1週間ほどの投稿を除いておきましょう。",
    },
    { type: "h2", text: "候⁠補⁠の⁠時⁠間⁠帯⁠を3⁠ス⁠テ⁠ッ⁠プ⁠で見⁠つ⁠け⁠る" },
    {
      type: "p",
      text: "用意するのは、今の発信内容に近い数か月分の投稿だけです。それぞれの投稿時刻、閲覧数、形式、テーマを記録しておきます。",
    },
    {
      type: "p",
      text: "ただし、データからわかるのは実際に投稿したことのある時間帯だけです。投稿がまだ20〜30件ほどしかない、またはほとんど同じ時間に投稿している場合は、比べる材料が足りません。そのときは最後の検証に進みましょう。続けやすい時間帯を二つ選んで交互に投稿すれば、検証そのものがデータになります。",
    },
    { type: "h3", text: "まず時間帯ごとに分けて、中央値で比べる" },
    {
      type: "p",
      text: "投稿した時間帯ごとにグループ分けし、平均ではなく**中央値**で比べます。理由はシンプルで、1件のバズで平均は大きく跳ね上がりますが、中央値ならその時間帯の典型的な投稿の成績がわかるからです。",
    },
    { type: "p", text: "たとえば、投稿をまとめるとこうなったとします。" },
    {
      type: "table",
      head: ["投稿時間帯", "投稿数", "閲覧数の中央値", "閲覧数の平均"],
      rows: [
        ["朝 8 時", "12", "1,200", "1,350"],
        ["昼 12 時", "3", "2,800", "6,400"],
        ["夜 9 時", "15", "1,900", "2,100"],
      ],
      caption: "説明用のデモデータです。",
    },
    {
      type: "p",
      text: "平均だけを見ると、昼12時が圧勝です。でも投稿は3件しかなく、平均が中央値の2倍以上あるので、1件のバズに引っ張られている可能性が高いでしょう。夜9時は15件の投稿に支えられ、中央値も朝より安定して高い。こちらのほうが信頼できる候補です。",
    },
    { type: "h3", text: "次に、件数を確かめて1位を信じすぎない" },
    {
      type: "p",
      text: "この例からも、件数の大切さがわかります。投稿が2〜3件しかない時間帯は、傾向というよりヒント程度です。簡単な確かめ方として、いちばん伸びた1件を除いてみましょう。それで差が消えるなら、本当の差ではありません。",
    },
    {
      type: "p",
      text: "もう一つ、気づきにくい落とし穴があります。24の時間帯を並べれば、投稿時間がまったく関係なくても、どこかが必ず1位になります。24人がそれぞれサイコロを何回か振れば、平均がやけに高い人が必ず出てきます。でもその人がサイコロ振りがうまいわけではなく、もう一度振ればたいてい普通の結果に戻ります。比べる枠が多いほど、1位はたまたま運が良かっただけの可能性が高くなります。だからこのステップで見つかるのは答えではなく候補で、最後の交互投稿による検証で確かめます。",
    },
    { type: "h3", text: "最後に曜日を加える" },
    {
      type: "p",
      text: "候補の時間帯が見つかったら、曜日も比べてみましょう。ただ、曜日と時間帯の両方で分けると、各グループの件数はかなり少なくなります。30件の投稿を7日×24時間に分ければ、ほとんどの枠は1〜2件です。枠が168もあれば、偶然だけで良く見える枠もいくつか出てきます。件数の少ないグループは、結論ではなく今後試すアイデアとして扱いましょう。",
    },
    { type: "h2", text: "比⁠べ⁠る⁠と⁠き⁠の落⁠と⁠し⁠穴" },
    {
      type: "p",
      text: "**1件のバズで判断する。**1件伸びただけでは、その時間帯が良いとは言えません。同じ時間帯のほかの投稿の中央値とばらつきを見ましょう。",
    },
    {
      type: "p",
      text: "**形式やテーマが混ざっている。**画像は昼、テキストは夜に投稿していると、差が形式によるものか時間帯によるものか区別できません。一度に比べるのは、同じ形式の投稿どうしにしましょう。",
    },
    {
      type: "p",
      text: "**タイムゾーンを取り違える。**グラフがどのタイムゾーンを使っているか確認し、一つに統一します。古い投稿ほど閲覧を集める時間が長く、当時はフォロワーも少なかった点にも注意しましょう。",
    },
    { type: "h2", text: "新⁠し⁠い⁠投⁠稿⁠時⁠間⁠を試⁠し⁠て⁠み⁠る" },
    {
      type: "p",
      text: "候補の時間帯が二つ決まったら、直接比べてみましょう。公平に比べるためのポイントは二つあります。比べられる投稿を使うことと、二つの時間帯に同じ曜日が回るようにすることです。",
    },
    {
      type: "p",
      text: "**比べられる投稿**とは、ふだんいちばん多く出している種類の投稿のことです。形式（テキストのみ、画像、動画）をそろえ、テーマもいつも書いているタイプにします。プレゼント企画やコラボ、話題のニュースに乗った投稿はもともと目立ちやすいので、比較から外しましょう。いろいろな投稿をするアカウントなら、テーマを無理にそろえる必要はありません。きちんと交互に出せば、内容の偏りは二つの時間帯にならされます。特別な投稿だけメモしておき、比べるときに除けば十分です。",
    },
    {
      type: "p",
      text: "**交互に出す**方法はシンプルです。今日は時間帯 A に1件、明日は時間帯 B に1件と、交互に投稿を続けます。1週間は7日なので、2週間続ければ、どの曜日にも両方の時間帯が1回ずつ回ってきます。",
    },
    {
      type: "p",
      text: "公開24時間後の数字を毎回メモする必要はありません。交互に投稿しているので、二つのグループの投稿は古さがだいたいそろっています。最後の検証投稿から1週間ほどたって閲覧数が落ち着いたら、二つのグループの閲覧数の中央値を比べましょう。過去の投稿をまとめるときに直近1週間分を除いたのと同じ考え方で、伸びがほぼ止まった数字どうしを比べるということです。",
    },
    {
      type: "p",
      text: "2週間で、それぞれの時間帯に7件ほど集まります。中央値の差が小さい、または各グループのいちばん伸びた1件を除くと差が消えるなら、引き分けと考えましょう。そのまま続けてもいいですし、続けやすいほうを選んでもかまいません。1週目と2週目を分けて見るのも有効です。同じ時間帯が2週とも勝っていれば、1回だけ大差で勝つより説得力があります。",
    },
    {
      type: "p",
      text: "はっきり差が出たら、成績の良いほうをメインの投稿時間にしましょう。読者は季節や学期、自分の発信内容によって変わるので、2〜3か月ごとに比べ直すのがおすすめです。",
    },
    { type: "h2", text: "T⁠h⁠r⁠e⁠a⁠d⁠s A⁠n⁠a⁠l⁠y⁠t⁠i⁠c⁠s で⁠の見⁠方" },
    {
      type: "p",
      text: "ここまでの手順は、どれも表計算ソフトでできます。[Threads Analytics](/analytics) を使っているなら、同期した投稿から自動で計算され、各ステップに対応するグラフがあります。",
    },
    {
      type: "ul",
      items: [
        "**投稿に最適な時間帯**：概要ページのカード。閲覧数の中央値が高い上位3つの時間帯を、件数と信頼度つきで表示します。3件以上の時間帯が優先されます。結論ではなく、検証する候補のリストとして使いましょう。",
        "**投稿に最適な時間**：パフォーマンスタブの時間帯別の棒グラフ。曜日で絞り込めます。検証が終わったら期間を検証期間に合わせれば、二つの時間帯の中央値をそのまま比べられます。",
        "**最適な曜日**：曜日ごとの閲覧数の中央値、エンゲージメント率、投稿数を比較します。",
        "**コンテンツタイプ × 時間帯**：コンテンツタブで、形式ごとの時間帯別の成績を比べられます。",
      ],
    },
    {
      type: "callout",
      text: "信頼度は件数だけで決まります。3件未満は低、3〜9件は中、10件以上は高です。統計的な検定ではなく、たくさんの時間帯から1位を選ぶことによる運の影響も取り除けません。だから最後のステップは、いつも実際の検証です。",
    },
    { type: "h2", text: "最⁠適⁠な⁠時⁠間⁠は⁠、自⁠分⁠の⁠デ⁠ー⁠タ⁠の中⁠に⁠あ⁠る" },
    {
      type: "p",
      text: "最適な投稿時間に決まった答えはありませんが、見つけ方には型があります。自分の投稿をグループ分けし、中央値と件数を確認して候補を絞り、交互に投稿して公平に検証すること。データが候補を出し、検証がそれを確かめます。他人の時間表を追いかけるより、こうして見つけた時間帯のほうが、ずっとあなたの読者に合っています。",
    },
  ],
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
