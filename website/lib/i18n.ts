export const locales = ["en", "zh-TW", "ja"] as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  ja: "日本語",
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const dictionaries = {
  en: {
    metadata: {
      title: "Turn your Threads data into better posts | Threads Analytics",
      description:
        "Self-hosted, open-source Threads analytics. Find your best posting time, content format, post length, and keywords — free, with your data on your own server.",
    },
    nav: {
      product: "Product",
      demo: "Live demo",
      features: "Features",
      deploy: "Deploy",
      github: "GitHub",
    },
    hero: {
      eyebrow: "OPEN SOURCE · SELF-HOSTED · BUILT FOR THREADS",
      lineOne: "Threads analytics that shows",
      lineTwo: "what makes a post work.",
      description:
        "Threads Analytics turns your own post history into practical signals—when to publish, what format to use, how long to write, and what earns real engagement.",
      primaryCta: "Try the live analysis",
      secondaryCta: "View on GitHub",
      note: "15+ analyses · Multi-account · Automatic sync",
    },
    proof: [
      { value: "15+", label: "analysis views" },
      { value: "3", label: "interface languages" },
      { value: "24/7", label: "automatic sync" },
      { value: "100%", label: "your infrastructure" },
    ],
    heroDemo: {
      label: "LIVE SIGNAL",
      title: "Your strongest posting window",
      window: "Tue · 20:00–22:00",
      lift: "+42% median views",
      chartLabel: "Views over the last 14 posts",
      postsLabel: "Top-performing posts",
      postsMetric: "Engagement",
      postOne: "A build log with one surprising lesson…",
      postTwo: "What changed after I stopped posting daily…",
      postThree: "The tiny workflow that saved me an hour…",
    },
    demo: {
      kicker: "01 / LIVE ANALYSIS",
      title: "Ask a better question. See the pattern move.",
      description:
        "Switch the post format and time range. The sample post, reach curve, and recommendation update together—just like exploring your own account.",
      formatLabel: "Post format",
      rangeLabel: "Time range",
      formats: {
        text: "Text",
        image: "Image",
        question: "Question",
      },
      ranges: {
        "7d": "7 days",
        "30d": "30 days",
        "90d": "90 days",
      },
      postSamples: {
        text: {
          label: "Text post",
          content:
            "Looking back at my recent posts, the quietest writing habit was driving the most replies.",
          tag: "Personal insight",
        },
        image: {
          label: "Image post",
          content:
            "A behind-the-scenes look at the dashboard I use to decide what to publish next.",
          tag: "Build in public",
        },
        question: {
          label: "Question post",
          content: "What is one metric you wish Threads showed you before you hit publish?",
          tag: "Conversation starter",
        },
      },
      views: "Median views",
      engagement: "Engagement rate",
      shares: "Share rate",
      chartTitle: "Reach by publishing time",
      chartSubtitle: "Median views, normalized to your baseline",
      baseline: "Your baseline",
      recommendation: "Recommended next move",
      recommendations: {
        text: "Publish a concise personal insight between 20:00 and 22:00.",
        image: "Pair the screenshot with a specific lesson instead of a feature list.",
        question: "Ask one narrow question and add your own answer in the opening line.",
      },
      rangeNotes: {
        "7d": "Treat this as an early signal and collect more posts before changing your schedule.",
        "30d": "The pattern is consistent enough to test for another month.",
        "90d": "The longer window confirms this is a durable pattern, not a one-off spike.",
      },
      likes: "likes",
      replies: "replies",
      reposts: "reposts",
      sharesLabel: "shares",
      disclaimer: "Illustrative demo data",
    },
    story: {
      kicker: "02 / WHY IT EXISTS",
      title: "Built because the answers were missing.",
      description:
        "Most analytics tools stop at totals. Threads Analytics started with a more useful question: what kind of post works for me, and when should I publish it?",
      quote:
        "I tried a few Threads analytics tools, but the analysis I wanted still wasn’t there—so I built it.",
      imageAlt: "The original Threads post announcing Threads Analytics",
      marker: "ORIGIN POST · 2026",
    },
    features: {
      kicker: "03 / FROM DATA TO DECISIONS",
      title: "More than a dashboard full of totals.",
      description:
        "Every view is designed to answer a publishing decision, not just report another number.",
      formatLengthVisual: {
        formatLabel: "Format",
        formatValue: "Text",
        lengthLabel: "Length",
        lengthValue: "Medium",
        resultLabel: "Best combination",
        resultValue: "above your baseline",
        lift: "+36%",
      },
      contentSignalsVisual: {
        keywordsLabel: "Recurring themes",
        keywords: ["workflow", "open source", "creator"],
        cadenceLabel: "7-day cadence",
        days: ["M", "T", "W", "T", "F", "S", "S"],
        streak: "5 day streak",
        frequency: "3.2 posts / week",
      },
      items: [
        {
          index: "01",
          tag: "TIMING",
          title: "Find your real posting window",
          body: "Compare hours and weekdays using medians, sample size, and confidence—not one lucky viral post.",
        },
        {
          index: "02",
          tag: "FORMAT × LENGTH",
          title: "See what shape your best ideas take",
          body: "Cross content format with post length to reveal combinations that consistently outperform your baseline.",
        },
        {
          index: "03",
          tag: "QUALITY MAP",
          title: "Separate reach from resonance",
          body: "Map every post by views and engagement rate to spot high-reach hits and quiet conversation starters.",
        },
        {
          index: "04",
          tag: "CONTENT SIGNALS",
          title: "Learn from words, gaps, and cadence",
          body: "Explore keywords, publishing gaps, consistency, streaks, and weekly frequency without exporting a spreadsheet.",
        },
        {
          index: "05",
          tag: "MULTI-ACCOUNT",
          title: "Keep every account in one place",
          body: "Switch profiles, sync automatically, and preserve each account’s own benchmark and posting behavior.",
        },
        {
          index: "06",
          tag: "SELF-HOSTED",
          title: "Your data stays on your stack",
          body: "Deploy with PostgreSQL on Railway, Zeabur, Docker, or your own server. Tokens are encrypted at rest.",
        },
      ],
    },
    product: {
      kicker: "04 / THE FULL PICTURE",
      title: "Fifteen-plus views. One publishing system.",
      description:
        "Move from account health to post-level diagnosis without leaving the dashboard. Overview, performance, content, and posts share one source of truth.",
      labels: ["Overview", "Performance", "Content", "Posts"],
      preview: {
        privateLabel: "Self-hosted",
        eyebrow: "Performance analysis",
        title: "Signals from your recent posts",
        ranges: ["7D", "30D", "90D"],
        signalLabel: "Best publishing window",
        signalValue: "Tue · 20:00–22:00",
        confidence: "High confidence",
        metricLabels: ["Median views", "Engagement", "Replies", "Shares"],
        chartTitle: "Reach trend",
        chartCaption: "Your last 14 posts",
        baseline: "Personal baseline",
      },
    },
    deploy: {
      kicker: "05 / OWN THE STACK",
      title: "From repository to your dashboard in minutes.",
      description:
        "Use a one-click template or run the container yourself. The official website stays separate; the deployable image contains only the analytics product.",
      railway: {
        eyebrow: "ONE-CLICK",
        title: "Deploy on Railway",
        body: "App, PostgreSQL, and required environment variables in one guided flow.",
        action: "Open Railway template",
      },
      zeabur: {
        eyebrow: "ONE-CLICK",
        title: "Deploy on Zeabur",
        body: "Start the service and database together, then connect your Threads token.",
        action: "Open Zeabur template",
      },
      docker: {
        eyebrow: "BRING YOUR OWN SERVER",
        title: "Docker / VPS",
        body: "Run the multi-architecture image anywhere with a PostgreSQL connection.",
        action: "View GitHub package",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    finalCta: {
      kicker: "READ YOUR OWN SIGNALS",
      title: "Your next better post is already in your history.",
      description:
        "Self-host Threads Analytics and turn old posts into your next publishing decision.",
      primary: "Deploy the dashboard",
      secondary: "Star on GitHub",
    },
    footer: {
      description: "Open-source analytics for people building on Threads.",
      product: "Product",
      resources: "Resources",
      liveDemo: "Live demo",
      featureOverview: "Feature overview",
      deployment: "Deployment",
      source: "Source code",
      readme: "Documentation",
    },
  },
  "zh-TW": {
    metadata: {
      title: "用自己的數據寫出更好的 Threads 貼文 | Threads Analytics",
      description:
        "自架式開源 Threads 分析儀表板，找出最佳發文時間、內容形式、文字長度、關鍵字與互動模式。免費部署，資料完全留在自己的伺服器。",
    },
    nav: {
      product: "產品",
      demo: "互動展示",
      features: "功能",
      deploy: "部署",
      github: "GitHub",
    },
    hero: {
      eyebrow: "開源 · 自架 · 為 THREADS 打造",
      lineOne: "用 Threads Analytics 看懂",
      lineTwo: "什麼樣的貼文會有成效。",
      description:
        "Threads Analytics 把你自己的貼文紀錄變成可行動的訊號：什麼時候發、用什麼形式、寫多長，以及什麼內容真正帶來互動。",
      primaryCta: "操作分析 Demo",
      secondaryCta: "前往 GitHub",
      note: "15+ 種分析 · 多帳號 · 自動同步",
    },
    proof: [
      { value: "15+", label: "種分析視圖" },
      { value: "3", label: "種介面語言" },
      { value: "24/7", label: "自動同步" },
      { value: "100%", label: "部署在自己的環境" },
    ],
    heroDemo: {
      label: "即時訊號",
      title: "你表現最好的發文時段",
      window: "週二 · 20:00–22:00",
      lift: "觀看中位數 +42%",
      chartLabel: "最近 14 篇貼文觀看走勢",
      postsLabel: "高成效貼文",
      postsMetric: "互動率",
      postOne: "開發紀錄裡，一個讓我意外的發現⋯",
      postTwo: "停止每天發文後，數據發生了什麼變化⋯",
      postThree: "這個小流程每週替我省下一小時⋯",
    },
    demo: {
      kicker: "01 / 互動分析",
      title: "換一個問題，看見不同模式。",
      description:
        "切換貼文形式與時間區間，範例貼文、觸及曲線和建議會一起更新，就像探索你自己的 Threads 帳號。",
      formatLabel: "貼文形式",
      rangeLabel: "時間區間",
      formats: {
        text: "純文字",
        image: "圖片",
        question: "提問",
      },
      ranges: {
        "7d": "7 天",
        "30d": "30 天",
        "90d": "90 天",
      },
      postSamples: {
        text: {
          label: "純文字貼文",
          content: "回頭整理近期貼文，我發現最不起眼的寫作習慣，反而帶來最多回覆。",
          tag: "個人洞察",
        },
        image: {
          label: "圖片貼文",
          content: "分享我用來決定下一篇要寫什麼的分析儀表板，以及背後真正改變的一件事。",
          tag: "公開開發",
        },
        question: {
          label: "提問貼文",
          content: "在按下發佈之前，你最希望 Threads 先告訴你哪一個數據？",
          tag: "開啟對話",
        },
      },
      views: "觀看中位數",
      engagement: "互動率",
      shares: "分享率",
      chartTitle: "不同發文時間的觸及",
      chartSubtitle: "以你的個人基準正規化後的觀看中位數",
      baseline: "個人基準",
      recommendation: "下一步建議",
      recommendations: {
        text: "在 20:00–22:00 發佈一篇精簡、具體的個人洞察。",
        image: "讓截圖搭配一個明確心得，而不是只列出功能。",
        question: "只問一個範圍明確的問題，並在開頭先給出自己的答案。",
      },
      rangeNotes: {
        "7d": "目前仍是早期訊號，先累積更多貼文再調整固定排程。",
        "30d": "這個模式已具一定一致性，適合再用一個月持續驗證。",
        "90d": "長期資料確認這不是單次高峰，可以納入固定發文策略。",
      },
      likes: "讚",
      replies: "回覆",
      reposts: "轉發",
      sharesLabel: "分享",
      disclaimer: "互動區使用示意資料",
    },
    story: {
      kicker: "02 / 為什麼做",
      title: "因為想看的答案，原本不存在。",
      description:
        "多數分析工具只停在總數。Threads Analytics 從更實際的問題開始：什麼類型的貼文適合我？我又該在什麼時間發佈？",
      quote: "用了幾個 Threads 分析工具後，總覺得少了自己想看的分析，所以乾脆自己做了一個。",
      imageAlt: "最初介紹 Threads Analytics 的 Threads 貼文",
      marker: "起點貼文 · 2026",
    },
    features: {
      kicker: "03 / 從數據到決策",
      title: "不只是堆滿總數的儀表板。",
      description: "每一個視圖都用來回答發文決策，而不是再多報告一個數字。",
      formatLengthVisual: {
        formatLabel: "形式",
        formatValue: "純文字",
        lengthLabel: "長度",
        lengthValue: "中等",
        resultLabel: "最佳組合",
        resultValue: "高於個人基準",
        lift: "+36%",
      },
      contentSignalsVisual: {
        keywordsLabel: "常見內容主題",
        keywords: ["工作流", "開源", "創作者"],
        cadenceLabel: "近 7 天節奏",
        days: ["一", "二", "三", "四", "五", "六", "日"],
        streak: "連續 5 天",
        frequency: "每週 3.2 篇",
      },
      items: [
        {
          index: "01",
          tag: "發文時機",
          title: "找出真正適合你的發文時段",
          body: "用中位數、樣本數和可信度比較小時與星期，不讓單篇爆文扭曲判斷。",
        },
        {
          index: "02",
          tag: "形式 × 長度",
          title: "看懂好點子最適合的呈現方式",
          body: "交叉分析內容形式與文字長度，找出持續高於個人基準的組合。",
        },
        {
          index: "03",
          tag: "單篇品質地圖",
          title: "把觸及和共鳴拆開來看",
          body: "用觀看和互動率定位每篇貼文，分辨高觸及熱門文與小而深的對話文。",
        },
        {
          index: "04",
          tag: "內容訊號",
          title: "從用詞、間隔和節奏裡學習",
          body: "直接探索關鍵字、發文間隔、穩定度、連續天數和每週頻率，不用匯出試算表。",
        },
        {
          index: "05",
          tag: "多帳號",
          title: "把所有帳號放在同一個地方",
          body: "快速切換帳號、自動同步，並保留每個帳號自己的基準與發文習慣。",
        },
        {
          index: "06",
          tag: "自架部署",
          title: "資料留在自己的環境",
          body: "使用 Railway、Zeabur、Docker 或自己的伺服器搭配 PostgreSQL，Token 會加密保存。",
        },
      ],
    },
    product: {
      kicker: "04 / 看見完整全貌",
      title: "超過 15 種分析，一套發文系統。",
      description:
        "從帳號健康度一路看到單篇診斷，不必離開儀表板。總覽、成效、內容與貼文共用同一份資料來源。",
      labels: ["總覽", "成效分析", "內容分析", "貼文"],
      preview: {
        privateLabel: "自架環境",
        eyebrow: "成效分析",
        title: "近期貼文的實用訊號",
        ranges: ["7 天", "30 天", "90 天"],
        signalLabel: "最佳發文時段",
        signalValue: "週二 · 20:00–22:00",
        confidence: "高可信度",
        metricLabels: ["觀看中位數", "互動率", "回覆", "分享"],
        chartTitle: "觸及趨勢",
        chartCaption: "最近 14 篇貼文",
        baseline: "個人基準",
      },
    },
    deploy: {
      kicker: "05 / 掌握自己的環境",
      title: "幾分鐘，部署好你的專屬儀表板。",
      description:
        "使用一鍵模板，或自己執行 Container。官方網站完全獨立，可部署的 image 只包含分析產品。",
      railway: {
        eyebrow: "一鍵部署",
        title: "部署到 Railway",
        body: "在同一個引導流程裡完成 App、PostgreSQL 與必要環境變數。",
        action: "開啟 Railway 模板",
      },
      zeabur: {
        eyebrow: "一鍵部署",
        title: "部署到 Zeabur",
        body: "一起啟動服務和資料庫，接著連接你的 Threads Token。",
        action: "開啟 Zeabur 模板",
      },
      docker: {
        eyebrow: "使用自己的伺服器",
        title: "Docker / VPS",
        body: "在任何地方執行多架構 image，只需要準備 PostgreSQL 連線。",
        action: "查看 GitHub Package",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    finalCta: {
      kicker: "讀懂自己的訊號",
      title: "下一篇更好的貼文，其實已經藏在歷史紀錄裡。",
      description: "自架 Threads Analytics，把舊貼文變成下一次發文的判斷依據。",
      primary: "部署分析儀表板",
      secondary: "在 GitHub 加星",
    },
    footer: {
      description: "為認真經營 Threads 的創作者打造的開源分析工具。",
      product: "產品",
      resources: "資源",
      liveDemo: "互動展示",
      featureOverview: "功能總覽",
      deployment: "部署方式",
      source: "原始碼",
      readme: "使用文件",
    },
  },
  ja: {
    metadata: {
      title: "自分のデータから、次の投稿を良くする | Threads Analytics",
      description:
        "投稿時間、コンテンツ形式、文章量、キーワード、エンゲージメント傾向を分析できるセルフホスト型Threadsダッシュボード。オープンソースで無料、データは自分のサーバーに残ります。",
    },
    nav: {
      product: "プロダクト",
      demo: "ライブデモ",
      features: "機能",
      deploy: "デプロイ",
      github: "GitHub",
    },
    hero: {
      eyebrow: "オープンソース · セルフホスト · THREADS 専用",
      lineOne: "Threads Analyticsで、",
      lineTwo: "伸びる投稿を勘で決めない。",
      description:
        "Threads Analyticsは、自分の投稿履歴を実用的なシグナルに変えます。いつ投稿するか、どの形式にするか、どれくらい書くか、何が本当の反応につながったかを把握できます。",
      primaryCta: "分析デモを試す",
      secondaryCta: "GitHubを見る",
      note: "15種類以上の分析 · 複数アカウント · 自動同期",
    },
    proof: [
      { value: "15+", label: "分析ビュー" },
      { value: "3", label: "対応言語" },
      { value: "24/7", label: "自動同期" },
      { value: "100%", label: "自分のインフラ" },
    ],
    heroDemo: {
      label: "ライブシグナル",
      title: "最も成果が出る投稿時間",
      window: "火曜日 · 20:00–22:00",
      lift: "閲覧中央値 +42%",
      chartLabel: "直近14投稿の閲覧推移",
      postsLabel: "高パフォーマンス投稿",
      postsMetric: "反応率",
      postOne: "開発ログで見つけた、意外な学び…",
      postTwo: "毎日投稿をやめた後に変わったこと…",
      postThree: "毎週1時間を取り戻した小さな仕組み…",
    },
    demo: {
      kicker: "01 / ライブ分析",
      title: "問いを変えると、パターンが動く。",
      description:
        "投稿形式と期間を切り替えると、サンプル投稿、リーチ曲線、提案が同時に更新されます。自分のアカウントを探索する感覚を試せます。",
      formatLabel: "投稿形式",
      rangeLabel: "期間",
      formats: {
        text: "テキスト",
        image: "画像",
        question: "質問",
      },
      ranges: {
        "7d": "7日",
        "30d": "30日",
        "90d": "90日",
      },
      postSamples: {
        text: {
          label: "テキスト投稿",
          content:
            "最近の投稿を振り返ると、目立たない書き方の習慣が最も多くの返信を生んでいました。",
          tag: "個人の気づき",
        },
        image: {
          label: "画像投稿",
          content:
            "次に何を書くかを決めるために使っている分析ダッシュボードと、そこから変えたこと。",
          tag: "Build in public",
        },
        question: {
          label: "質問投稿",
          content: "投稿ボタンを押す前に、Threadsから教えてほしい指標は何ですか？",
          tag: "会話のきっかけ",
        },
      },
      views: "閲覧中央値",
      engagement: "エンゲージメント率",
      shares: "シェア率",
      chartTitle: "投稿時間別のリーチ",
      chartSubtitle: "自分の基準値で正規化した閲覧中央値",
      baseline: "自分の基準",
      recommendation: "次のアクション",
      recommendations: {
        text: "20:00〜22:00に、短く具体的な個人の気づきを投稿しましょう。",
        image: "機能一覧ではなく、スクリーンショットに具体的な学びを一つ添えましょう。",
        question: "質問を一つに絞り、冒頭に自分の答えも添えましょう。",
      },
      rangeNotes: {
        "7d": "まだ初期シグナルなので、投稿を増やしてから固定スケジュールを調整しましょう。",
        "30d": "十分に一貫した傾向なので、もう1か月検証する価値があります。",
        "90d": "長期データから、一時的な伸びではなく持続的な傾向だと確認できます。",
      },
      likes: "いいね",
      replies: "返信",
      reposts: "再投稿",
      sharesLabel: "シェア",
      disclaimer: "デモ用のサンプルデータ",
    },
    story: {
      kicker: "02 / つくった理由",
      title: "欲しい答えが、まだなかったから。",
      description:
        "多くの分析ツールは合計値で止まります。Threads Analyticsは、もっと実用的な問いから始まりました。自分にはどんな投稿が合い、いつ公開すべきなのか。",
      quote:
        "いくつかのThreads分析ツールを試しても、見たい分析が足りなかったので、自分で作りました。",
      imageAlt: "Threads Analyticsを最初に紹介したThreads投稿",
      marker: "最初の投稿 · 2026",
    },
    features: {
      kicker: "03 / データから判断へ",
      title: "合計値を並べるだけのダッシュボードではありません。",
      description: "すべてのビューは、投稿についての判断に答えるために設計されています。",
      formatLengthVisual: {
        formatLabel: "形式",
        formatValue: "テキスト",
        lengthLabel: "長さ",
        lengthValue: "中くらい",
        resultLabel: "最適な組み合わせ",
        resultValue: "自分の基準を上回る",
        lift: "+36%",
      },
      contentSignalsVisual: {
        keywordsLabel: "よく出るテーマ",
        keywords: ["ワークフロー", "オープンソース", "クリエイター"],
        cadenceLabel: "直近7日のリズム",
        days: ["月", "火", "水", "木", "金", "土", "日"],
        streak: "5日連続",
        frequency: "週 3.2 投稿",
      },
      items: [
        {
          index: "01",
          tag: "タイミング",
          title: "自分に合う投稿時間を見つける",
          body: "中央値、サンプル数、信頼度で時間帯と曜日を比較し、一度のバズに判断を左右されません。",
        },
        {
          index: "02",
          tag: "形式 × 長さ",
          title: "良いアイデアに合う形を知る",
          body: "コンテンツ形式と文章量を掛け合わせ、自分の基準を継続的に上回る組み合わせを見つけます。",
        },
        {
          index: "03",
          tag: "投稿品質マップ",
          title: "リーチと共感を分けて見る",
          body: "閲覧数とエンゲージメント率で投稿を配置し、広く届いた投稿と深い会話を生んだ投稿を見分けます。",
        },
        {
          index: "04",
          tag: "コンテンツシグナル",
          title: "言葉、間隔、リズムから学ぶ",
          body: "キーワード、投稿間隔、継続性、連続日数、週間頻度を、表計算への書き出しなしで探索できます。",
        },
        {
          index: "05",
          tag: "複数アカウント",
          title: "すべてのアカウントを一か所に",
          body: "プロフィールを切り替え、自動同期し、アカウントごとの基準と投稿傾向を維持します。",
        },
        {
          index: "06",
          tag: "セルフホスト",
          title: "データは自分の環境に置く",
          body: "Railway、Zeabur、Docker、または自分のサーバーへPostgreSQLと一緒にデプロイ。Tokenは暗号化されます。",
        },
      ],
    },
    product: {
      kicker: "04 / 全体像",
      title: "15種類以上の分析を、一つの投稿システムに。",
      description:
        "アカウント全体の状態から投稿単位の診断まで、ダッシュボード内で移動できます。概要、パフォーマンス、コンテンツ、投稿は同じデータを共有します。",
      labels: ["概要", "パフォーマンス", "コンテンツ", "投稿"],
      preview: {
        privateLabel: "セルフホスト",
        eyebrow: "パフォーマンス分析",
        title: "最近の投稿から見えるシグナル",
        ranges: ["7日", "30日", "90日"],
        signalLabel: "最適な投稿時間",
        signalValue: "火曜 · 20:00–22:00",
        confidence: "高い信頼度",
        metricLabels: ["閲覧中央値", "反応率", "返信", "シェア"],
        chartTitle: "リーチ推移",
        chartCaption: "直近14件の投稿",
        baseline: "個人基準",
      },
    },
    deploy: {
      kicker: "05 / 自分のスタックで",
      title: "リポジトリから自分のダッシュボードまで、数分で。",
      description:
        "ワンクリックテンプレート、または自分でコンテナを実行できます。公式サイトは独立し、配布imageには分析プロダクトだけが含まれます。",
      railway: {
        eyebrow: "ワンクリック",
        title: "Railwayへデプロイ",
        body: "App、PostgreSQL、必要な環境変数を一つのガイドで設定します。",
        action: "Railwayテンプレートを開く",
      },
      zeabur: {
        eyebrow: "ワンクリック",
        title: "Zeaburへデプロイ",
        body: "サービスとデータベースを同時に起動し、Threads Tokenを接続します。",
        action: "Zeaburテンプレートを開く",
      },
      docker: {
        eyebrow: "自分のサーバーで",
        title: "Docker / VPS",
        body: "PostgreSQL接続を用意すれば、マルチアーキテクチャimageをどこでも実行できます。",
        action: "GitHub Packageを見る",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    finalCta: {
      kicker: "自分のシグナルを読む",
      title: "次の良い投稿は、すでに履歴の中にあります。",
      description: "Threads Analyticsをセルフホストし、過去の投稿を次の判断材料に変えましょう。",
      primary: "ダッシュボードをデプロイ",
      secondary: "GitHubでスター",
    },
    footer: {
      description: "Threadsで発信する人のためのオープンソース分析ツール。",
      product: "プロダクト",
      resources: "リソース",
      liveDemo: "ライブデモ",
      featureOverview: "機能一覧",
      deployment: "デプロイ",
      source: "ソースコード",
      readme: "ドキュメント",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
