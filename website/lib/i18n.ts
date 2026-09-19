import { vercelAgentPrompt } from "./agent-prompts";
import { railwayTemplate, zeaburTemplate } from "./links";
import type { Locale } from "./locales";

// The locale registry lives in locales.ts (dictionary-free so proxy.ts can
// import it); re-exported here so existing `@/lib/i18n` imports keep working.
export { locales, localeNames, isLocale, type Locale } from "./locales";

// Token guide copy is typed explicitly (instead of relying on inference like
// the rest of the dictionaries) because steps carry optional bullets/notes —
// without a shared type, each locale would infer a slightly different shape.
export type TokenGuideStep = {
  title: string;
  /** Body text; `**…**` marks UI labels the page renders in bold. */
  body: string;
  bullets?: string[];
  note?: string;
};

export type TokenGuidePhase = {
  index: string;
  /** Step range shown on the phase card and progress nav, e.g. "1–6". */
  range: string;
  title: string;
  body: string;
  steps: TokenGuideStep[];
};

export type TokenGuideCopy = {
  metadata: { title: string; description: string };
  hero: {
    kicker: string;
    lineOne: string;
    lineTwo: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
    checklistLabel: string;
    checklist: string[];
    checklistNote: string;
    resultLabel: string;
    resultValue: string;
  };
  overview: { kicker: string; title: string; description: string };
  stepsLabel: string;
  stepLabel: string;
  progressLabel: string;
  phases: TokenGuidePhase[];
  finish: {
    kicker: string;
    title: string;
    description: string;
    expiry: string;
    primary: string;
    secondary: string;
  };
};

// MCP guide copy shares one explicit type for the same reason as the token
// guide: the card lists must keep an identical shape across locales.
export type McpGuideCard = {
  /** Mono chip above the card title, e.g. a tool or client name. */
  tag: string;
  index: string;
  title: string;
  body: string;
};

export type McpGuideCopy = {
  metadata: { title: string; description: string };
  hero: {
    kicker: string;
    lineOne: string;
    lineTwo: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
    endpointLabel: string;
    commandLabel: string;
    codexCommandLabel: string;
    copy: string;
    copied: string;
    hint: string;
    worksWith: string;
    moreAgents: string;
  };
  capabilities: {
    kicker: string;
    title: string;
    description: string;
    /** Status chip on the tools-manifest panel, e.g. "READ-ONLY". */
    panelBadge: string;
    items: McpGuideCard[];
  };
  connect: {
    kicker: string;
    title: string;
    description: string;
    steps: { index: string; title: string; body: string }[];
    /** Per-client switcher entries: `tag` is the tab label. */
    clients: McpGuideCard[];
    /** The shared final step: the dashboard's consent screen. `dialog`
     * strings mirror the dashboard's oauthConsent dictionary. */
    consent: {
      title: string;
      body: string;
      /** Success flash shown when the mock's Authorize button is clicked. */
      connected: string;
      dialog: {
        title: string;
        subtitle: string;
        scopeTitle: string;
        scopeRead: string;
        scopeNoWrite: string;
        deny: string;
        approve: string;
      };
    };
    /** Post-connect management: the dashboard's Settings → Connected Agents
     * card, recreated. `panel` strings mirror the app's mcpAgents dictionary. */
    manage: {
      title: string;
      body: string;
      panel: {
        title: string;
        subtitle: string;
        revoke: string;
        agents: { name: string; meta: string }[];
      };
    };
  };
  usage: {
    kicker: string;
    title: string;
    description: string;
    examplesLabel: string;
    /** Chat replay entries: question, sample reply, and the MCP tools the
     * agent calls in between (tool names, identical across locales). */
    examples: { q: string; a: string; tools: string[] }[];
    examplesNote: string;
    promptsLabel: string;
    prompts: McpGuideCard[];
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
    revokeNote: string;
  };
};

export type GiveawayConditionId = "dedupe" | "keyword" | "mentions" | "deadline";

export type GiveawayGuideCopy = {
  metadata: { title: string; description: string };
  hero: {
    kicker: string;
    lineOne: string;
    lineTwo: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
    hint: string;
    /** Looping winner reveal; the homepage giveaway section reuses it. */
    resultCard: {
      label: string;
      badge: string;
      shuffling: string;
      summary: string;
      prizes: { name: string; winners: string[] }[];
      replay: string;
    };
  };
  how: {
    kicker: string;
    title: string;
    description: string;
    steps: { index: string; title: string; body: string }[];
  };
  conditions: {
    kicker: string;
    title: string;
    description: string;
    panelBadge: string;
    items: { tag: string; index: string; title: string; body: string }[];
  };
  demo: {
    kicker: string;
    title: string;
    description: string;
    /** Playable replica of the dashboard's giveaway panel. Toggling a
     * condition filters `entries` live; `id` selects the filter. */
    panel: {
      conditionsLabel: string;
      prizesLabel: string;
      entriesLabel: string;
      eligibleLabel: string;
      filteredLabel: string;
      drawLabel: string;
      drawingLabel: string;
      redrawLabel: string;
      resultsLabel: string;
      emptyLabel: string;
      summary: string;
      conditions: { id: GiveawayConditionId; label: string; hint: string }[];
      prizes: { name: string; count: number }[];
      entries: {
        user: string;
        text: string;
        mentions: number;
        keyword: boolean;
        /** Replied after the sample deadline. */
        late?: boolean;
      }[];
    };
    note: string;
  };
  fairness: {
    kicker: string;
    title: string;
    description: string;
    items: { index: string; title: string; body: string }[];
    tokenNote: string;
    tokenCta: string;
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
    note: string;
  };
};

export type AnalyticsSection = {
  index: string;
  kicker: string;
  title: string;
  description: string;
  /** Mono name on the panel header, e.g. "threads-analytics · overview". */
  panelName: string;
  badge: string;
  /** Short meta shown beside the title in the sticky rail. */
  railMeta: string;
  /** The stat strip above the tab's charts, when it has one. */
  stats?: { label: string; items: string[] };
  items: { name: string; body: string }[];
  /** Caveat printed under the panel (the audience tab's API limits). */
  note?: string;
};

export type AnalyticsGuideCopy = {
  metadata: { title: string; description: string };
  hero: {
    kicker: string;
    lineOne: string;
    lineTwo: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    note: string;
    hint: string;
    /** Section counts, doubling as the page's table of contents. */
    summary: {
      label: string;
      badge: string;
      total: string;
      totalLabel: string;
      rows: { name: string; count: string }[];
    };
  };
  railLabel: string;
  sections: AnalyticsSection[];
  method: {
    index: string;
    kicker: string;
    title: string;
    description: string;
    railMeta: string;
    items: { index: string; title: string; body: string }[];
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
    note: string;
  };
};

const tokenGuideEn: TokenGuideCopy = {
  metadata: {
    title: "How to Get a Threads Access Token (Threads API): 18-Step Guide",
    description:
      "Get a long-lived Threads API access token step by step, with screenshots: create a Meta app, add the Threads API use case, invite a Threads Tester, copy the token.",
  },
  hero: {
    kicker: "GUIDE / THREADS ACCESS TOKEN",
    lineOne: "Eighteen steps.",
    lineTwo: "One Threads access token.",
    description:
      "Your dashboard is deployed. Now it needs a key: follow one screenshot per step through Meta for Developers and leave with a long-lived Threads access token.",
    primaryCta: "Start with step 1",
    secondaryCta: "Open Meta Developers",
    note: "About 10 minutes · Free · No code involved",
    checklistLabel: "BEFORE YOU START",
    checklist: [
      "A Facebook / Meta account that can sign in to Meta for Developers",
      "A public Threads account",
      "Access to the Threads account that will accept the tester invitation",
    ],
    checklistNote:
      "This flow covers personal and testing use. Supporting non-test users usually requires App Review and publishing the app.",
    resultLabel: "WHAT YOU LEAVE WITH",
    resultValue: "Long-lived Threads access token",
  },
  overview: {
    kicker: "01 / THE ROUTE",
    title: "Four phases. Eighteen steps.",
    description:
      "Every step is one screenshot and one click. Three happen inside Threads; everything else lives in Meta for Developers.",
  },
  stepsLabel: "STEPS",
  stepLabel: "STEP",
  progressLabel: "ON THIS PAGE",
  phases: [
    {
      index: "01",
      range: "1–6",
      title: "Create the Meta app",
      body: "Six screens of the app-creation wizard — name it, pick the Threads API use case, and skip everything optional.",
      steps: [
        {
          title: "Open Meta Developers and create an app",
          body: "Open **developers.facebook.com/apps** and click **Create App** in the top-right corner of the **Apps** page.",
        },
        {
          title: "Enter app details",
          body: "On the **Create an app** page, fill in the two fields, then click **Next**.",
          bullets: [
            "**App name** — for example, Threads Analytics",
            "**App contact email** — your contact email",
          ],
        },
        {
          title: "Select the Threads API use case",
          body: "On the **Add use cases** page, find **Access the Threads API**, select the checkbox on the right, and click **Next**.",
        },
        {
          title: "Skip the business portfolio",
          body: "On the business portfolio step, select **I don't want to connect a business portfolio yet.**, then click **Next**.",
        },
        {
          title: "Confirm publishing requirements",
          body: "When the page shows **No requirements identified**, there is nothing extra to prepare for this setup. Click **Next**.",
        },
        {
          title: "Create the app",
          body: "On the **Overview** page, confirm the app name, email, use case, business, and requirements, then click **Create app** in the bottom-right corner.",
        },
      ],
    },
    {
      index: "02",
      range: "7–12",
      title: "Invite a Threads Tester",
      body: "Open the use case settings and hand the tester role to the Threads account that owns the data.",
      steps: [
        {
          title: "Open Use cases",
          body: "The Dashboard appears once the app is created. Click **Use cases** in the left sidebar.",
        },
        {
          title: "Customize the Threads API use case",
          body: "On the **Use cases** page, find **Access the Threads API** and click **Customize**.",
        },
        {
          title: "Open Settings",
          body: "Inside **Customize use case**, the left panel shows **Permissions and features** and **Settings**. Click **Settings**.",
        },
        {
          title: "Open Threads Tester management",
          body: "At the bottom of the **Settings** page, find **User Token Generator** and click **Add or Remove Threads Testers**. The same page also lists:",
          bullets: [
            "**Threads app ID**",
            "**Threads app secret**",
            "**Threads Display Name**",
            "**User Token Generator**",
          ],
        },
        {
          title: "Add people",
          body: "You land on the **App roles** page. Click **Add People** in the top-right corner.",
        },
        {
          title: "Assign the Threads Tester role",
          body: "In the **Add people to your app** dialog:",
          bullets: [
            "Select **Threads Tester**",
            "Search for and select the Threads account that should generate the token",
            "Click **Add**",
          ],
          note: "The invited account must be a public Threads account and has to accept the invitation from Threads. If it doesn't appear in search, confirm the user has a Meta developer account and a public Threads profile.",
        },
      ],
    },
    {
      index: "03",
      range: "13–14",
      title: "Accept in Threads",
      body: "Switch to the invited Threads account for two clicks — the invitation is waiting under website permissions.",
      steps: [
        {
          title: "Open website permissions in Threads",
          body: "With the invited Threads account, open Threads on the web. Go to **More settings**, then click **Website permissions**.",
        },
        {
          title: "Accept the tester invitation",
          body: "In the **Invites** tab, find the app you created — for example **Threads Analytics** — and click **Accept**.",
        },
      ],
    },
    {
      index: "04",
      range: "15–18",
      title: "Generate the token",
      body: "Back in Meta Developers: generate, authorize, copy. The long-lived token is yours.",
      steps: [
        {
          title: "Return to Threads API Settings",
          body: "Back in Meta Developers, go to **Use cases** → **Access the Threads API** → **Customize**, then click **Settings** in the left panel.",
        },
        {
          title: "Generate the access token",
          body: "In **User Token Generator**, find the Threads Tester that accepted the invitation and click **Generate Access Token** on the right.",
        },
        {
          title: "Confirm authorization",
          body: "The authorization page lists the Threads permissions the app will receive. Confirm the account is correct, then click **Continue As …**.",
          note: "If you open **Edit access**, keep the data and insights permissions enabled — without them the token can't sync analytics data.",
        },
        {
          title: "Copy the access token",
          body: "Back in Meta Developers, the token dialog appears. Select **I understand**, then click **Copy** to copy your long-lived Threads access token.",
        },
      ],
    },
  ],
  finish: {
    kicker: "AFTER THE TOKEN",
    title: "Token copied? Bring it home.",
    description:
      "Paste it into your dashboard under **Settings → Add Threads account** and run the first sync.",
    expiry:
      "Tokens last 60 days, and the dashboard renews them automatically during sync — you won't need this guide again. If a token still expires because the app was offline too long, generate a fresh one here and paste it with **Update token** on the account card; your synced data is kept.",
    primary: "See deploy options",
    secondary: "View on GitHub",
  },
};

const tokenGuideZh: TokenGuideCopy = {
  metadata: {
    title: "Threads API 申請與 Access Token 取得教學：18 步驟圖解",
    description:
      "Threads API 申請、Access Token 取得完整教學，一步一張截圖：建立 Meta App、加入 Threads API Use Case、邀請 Threads Tester，複製 Long-lived Access Token。",
  },
  hero: {
    kicker: "教學 / THREADS ACCESS TOKEN",
    lineOne: "Threads Access Token，",
    // \u2060 word joiners: line two only breaks between 跟著, 十八個步驟 and 拿到手.
    lineTwo: "跟⁠著十⁠八⁠個⁠步⁠驟拿⁠到⁠手⁠。",
    description:
      "Dashboard 部署好了，還差一把鑰匙。跟著 Meta for Developers 的畫面一步一步走，拿到 Long-lived Threads Access Token。",
    primaryCta: "從 Step 1 開始",
    secondaryCta: "開啟 Meta Developers",
    note: "約 10 分鐘 · 免費 · 不需要寫程式",
    checklistLabel: "開始前準備",
    checklist: [
      "一個可登入 Meta for Developers 的 Facebook / Meta 帳號",
      "一個公開的 Threads 帳號",
      "可以用該 Threads 帳號接受測試者邀請",
    ],
    checklistNote:
      "這個流程適合個人或測試用途。若要讓非測試者使用，通常還需要完成 App Review 與發布流程。",
    resultLabel: "完成後你會拿到",
    resultValue: "Long-lived Threads Access Token",
  },
  overview: {
    kicker: "01 / 路線圖",
    title: "四⁠個⁠階⁠段⁠，十⁠八⁠個⁠步⁠驟⁠。",
    description:
      "每一步都是一張截圖、一次點擊。其中三步在 Threads 完成，其餘都在 Meta for Developers。",
  },
  stepsLabel: "步驟",
  stepLabel: "STEP",
  progressLabel: "本頁進度",
  phases: [
    {
      index: "01",
      range: "1–6",
      title: "建立 Meta App",
      body: "六個建立 App 的畫面 — 命名、選擇 Threads API Use Case，其餘可選項目全部跳過。",
      steps: [
        {
          title: "前往 Meta Developers 並建立 App",
          body: "開啟 **developers.facebook.com/apps**，在 **Apps** 頁面右上角點擊 **Create App**。",
        },
        {
          title: "填寫 App 基本資料",
          body: "在 **Create an app** 頁面填寫兩個欄位，確認後點擊 **Next**。",
          bullets: [
            "**App name** — 例如 Threads Analytics",
            "**App contact email** — 你的聯絡信箱",
          ],
        },
        {
          title: "選擇 Threads API Use Case",
          body: "在 **Add use cases** 頁面找到 **Access the Threads API**，勾選右側方框，然後點擊 **Next**。",
        },
        {
          title: "跳過 business portfolio",
          body: "在 business portfolio 步驟選擇 **I don't want to connect a business portfolio yet.**，再點擊 **Next**。",
        },
        {
          title: "確認發布需求",
          body: "畫面顯示 **No requirements identified** 時，代表目前沒有額外需求。點擊 **Next**。",
        },
        {
          title: "建立 App",
          body: "在 **Overview** 頁面確認 App 名稱、信箱、Use Case、Business 與 Requirements 都正確後，點擊右下角 **Create app**。",
        },
      ],
    },
    {
      index: "02",
      range: "7–12",
      title: "邀請 Threads Tester",
      body: "打開 Use Case 設定，把測試者角色指派給擁有數據的 Threads 帳號。",
      steps: [
        {
          title: "進入 Use cases",
          body: "App 建立完成後會進入 Dashboard。從左側選單點擊 **Use cases**。",
        },
        {
          title: "自訂 Threads API Use Case",
          body: "在 **Use cases** 頁面找到 **Access the Threads API**，點擊右側 **Customize**。",
        },
        {
          title: "進入 Settings",
          body: "進入 **Customize use case** 後，左側會看到 **Permissions and features** 與 **Settings**。點擊 **Settings**。",
        },
        {
          title: "開啟 Threads Tester 管理",
          body: "在 **Settings** 頁面下方找到 **User Token Generator**，點擊 **Add or Remove Threads Testers**。這個頁面也會列出：",
          bullets: [
            "**Threads app ID**",
            "**Threads app secret**",
            "**Threads Display Name**",
            "**User Token Generator**",
          ],
        },
        {
          title: "新增測試人員",
          body: "系統會進入 **App roles** 頁面。點擊右上角 **Add People**。",
        },
        {
          title: "指派 Threads Tester 角色",
          body: "在 **Add people to your app** 視窗中：",
          bullets: [
            "選擇 **Threads Tester**",
            "搜尋並選取要產生 Token 的 Threads 帳號",
            "點擊 **Add**",
          ],
          note: "受邀帳號必須是公開的 Threads 帳號，並且要在 Threads 端接受邀請。如果搜尋不到帳號，請確認該使用者有 Meta 開發者帳號，且 Threads 個人檔案已設為公開。",
        },
      ],
    },
    {
      index: "03",
      range: "13–14",
      title: "到 Threads 接受邀請",
      body: "切換到受邀的 Threads 帳號，只要兩次點擊 — 邀請就在網站權限設定裡等著。",
      steps: [
        {
          title: "到 Threads 開啟網站權限",
          body: "使用受邀的 Threads 帳號開啟 Threads 網頁版，進入 **More settings**，再點擊 **Website permissions**。",
        },
        {
          title: "接受測試者邀請",
          body: "在 **Invites** 分頁中找到剛建立的 App — 例如 **Threads Analytics** — 點擊 **Accept**。",
        },
      ],
    },
    {
      index: "04",
      range: "15–18",
      title: "產生 Token",
      body: "回到 Meta Developers：產生、授權、複製，Long-lived Token 就到手了。",
      steps: [
        {
          title: "回到 Threads API Settings",
          body: "回到 Meta Developers 的 App 頁面，進入 **Use cases** → **Access the Threads API** → **Customize**，再點擊左側 **Settings**。",
        },
        {
          title: "產生 Access Token",
          body: "在 **User Token Generator** 區塊中，找到剛接受邀請的 Threads Tester，點擊右側 **Generate Access Token**。",
        },
        {
          title: "確認授權",
          body: "授權頁會列出 App 將取得的 Threads 權限。確認帳號正確後，點擊 **Continue As …**。",
          note: "如果點擊 **Edit access**，請保持資料與 Insights 權限開啟 — 關閉的話 Token 將無法同步分析資料。",
        },
        {
          title: "複製 Access Token",
          body: "回到 Meta Developers 後會出現 Token 視窗。勾選 **I understand**，再點擊 **Copy** 複製產生的 Long-lived Threads Access Token。",
        },
      ],
    },
  ],
  finish: {
    kicker: "拿到 TOKEN 之後",
    title: "複⁠製⁠好⁠了⁠？把⁠它⁠帶⁠回⁠家⁠。",
    description: "把 Token 貼到 Dashboard 的 **Settings → Add Threads account**，執行第一次同步。",
    expiry:
      "Token 有效期為 60 天，Dashboard 會在同步時自動續期，之後不需要再跑一次這份教學。若 App 離線太久導致 Token 過期，再依同樣流程產生一組，用帳號卡片上的 **Update token** 貼回即可，已同步的資料都會保留。",
    primary: "查看部署方式",
    secondary: "前往 GitHub",
  },
};

const tokenGuideJa: TokenGuideCopy = {
  metadata: {
    title: "Threads アクセストークンの取得方法：Threads API 設定 18 ステップ図解",
    description:
      "Threads API のアクセストークン取得ガイド（スクリーンショット付き）：Meta App の作成、Threads API の Use Case 追加、Threads Tester の招待、Long-lived トークンのコピーまで。",
  },
  hero: {
    kicker: "ガイド / THREADS ACCESS TOKEN",
    lineOne: "18ス⁠テ⁠ッ⁠プで、",
    lineTwo: "ア⁠ク⁠セ⁠ス⁠ト⁠ー⁠ク⁠ンを手に。",
    description:
      "ダッシュボードの準備は完了。あとは鍵だけ。Meta for Developers の画面を 1 ステップずつ進み、Long-lived な Threads アクセストークンを取得します。",
    primaryCta: "Step 1 から始める",
    secondaryCta: "Meta Developers を開く",
    note: "約10分 · 無料 · コード不要",
    checklistLabel: "始める前に",
    checklist: [
      "Meta for Developers にログインできる Facebook / Meta アカウント",
      "公開設定の Threads アカウント",
      "テスター招待を承認できる Threads アカウント",
    ],
    checklistNote:
      "この手順は個人利用またはテスト用途を想定しています。テスター以外のユーザーに使わせる場合は、通常 App Review と公開手続きが必要です。",
    resultLabel: "最後に手に入るもの",
    resultValue: "Long-lived Threads アクセストークン",
  },
  overview: {
    kicker: "01 / 全体の流れ",
    title: "4⁠つ⁠の⁠フ⁠ェ⁠ー⁠ズ⁠、1⁠8⁠の⁠ス⁠テ⁠ッ⁠プ⁠。",
    description:
      "各ステップはスクリーンショット1枚とクリック1回。3ステップは Threads 側、それ以外はすべて Meta for Developers 側です。",
  },
  stepsLabel: "ステップ",
  stepLabel: "STEP",
  progressLabel: "このページ",
  phases: [
    {
      index: "01",
      range: "1–6",
      title: "Meta App を作成する",
      body: "App 作成ウィザードの6画面 — 名前を付け、Threads API の Use Case を選び、オプションはすべてスキップします。",
      steps: [
        {
          title: "Meta Developers を開いて App を作成する",
          body: "**developers.facebook.com/apps** を開き、**Apps** ページ右上の **Create App** をクリックします。",
        },
        {
          title: "App の基本情報を入力する",
          body: "**Create an app** ページで2つの項目を入力し、**Next** をクリックします。",
          bullets: [
            "**App name** — 例：Threads Analytics",
            "**App contact email** — 連絡用メールアドレス",
          ],
        },
        {
          title: "Threads API の Use Case を選択する",
          body: "**Add use cases** ページで **Access the Threads API** を探し、右側のチェックボックスを選択して **Next** をクリックします。",
        },
        {
          title: "business portfolio をスキップする",
          body: "business portfolio の手順では **I don't want to connect a business portfolio yet.** を選択し、**Next** をクリックします。",
        },
        {
          title: "公開要件を確認する",
          body: "**No requirements identified** と表示されていれば、追加要件はありません。**Next** をクリックします。",
        },
        {
          title: "App を作成する",
          body: "**Overview** ページで App 名、メールアドレス、Use Case、Business、Requirements を確認し、右下の **Create app** をクリックします。",
        },
      ],
    },
    {
      index: "02",
      range: "7–12",
      title: "Threads Tester を招待する",
      body: "Use Case の設定を開き、データの持ち主である Threads アカウントにテスターロールを割り当てます。",
      steps: [
        {
          title: "Use cases を開く",
          body: "App 作成後、Dashboard が表示されます。左側メニューの **Use cases** をクリックします。",
        },
        {
          title: "Threads API Use Case をカスタマイズする",
          body: "**Use cases** ページで **Access the Threads API** を見つけ、右側の **Customize** をクリックします。",
        },
        {
          title: "Settings を開く",
          body: "**Customize use case** に入ると、左側に **Permissions and features** と **Settings** が表示されます。**Settings** をクリックします。",
        },
        {
          title: "Threads Tester の管理画面を開く",
          body: "**Settings** ページ下部の **User Token Generator** を見つけ、**Add or Remove Threads Testers** をクリックします。このページでは次の情報も確認できます。",
          bullets: [
            "**Threads app ID**",
            "**Threads app secret**",
            "**Threads Display Name**",
            "**User Token Generator**",
          ],
        },
        {
          title: "ユーザーを追加する",
          body: "**App roles** ページに移動します。右上の **Add People** をクリックします。",
        },
        {
          title: "Threads Tester ロールを割り当てる",
          body: "**Add people to your app** ダイアログで次の操作を行います。",
          bullets: [
            "**Threads Tester** を選択する",
            "トークンを生成したい Threads アカウントを検索して選択する",
            "**Add** をクリックする",
          ],
          note: "招待されるアカウントは公開 Threads アカウントである必要があり、Threads 側で招待を承認する必要があります。検索に表示されない場合は、そのユーザーが Meta 開発者アカウントを持ち、Threads プロフィールが公開設定であることを確認してください。",
        },
      ],
    },
    {
      index: "03",
      range: "13–14",
      title: "Threads で承認する",
      body: "招待された Threads アカウントに切り替えて2クリック — 招待は Website permissions で待っています。",
      steps: [
        {
          title: "Threads の Website permissions を開く",
          body: "招待された Threads アカウントで Threads Web 版を開き、**More settings** に移動して **Website permissions** をクリックします。",
        },
        {
          title: "テスター招待を承認する",
          body: "**Invites** タブで作成した App — 例 **Threads Analytics** — を見つけ、**Accept** をクリックします。",
        },
      ],
    },
    {
      index: "04",
      range: "15–18",
      title: "トークンを生成する",
      body: "Meta Developers に戻って、生成、認可、コピー。Long-lived トークンの完成です。",
      steps: [
        {
          title: "Threads API Settings に戻る",
          body: "Meta Developers の App 画面に戻り、**Use cases** → **Access the Threads API** → **Customize** に移動して、左側の **Settings** をクリックします。",
        },
        {
          title: "アクセストークンを生成する",
          body: "**User Token Generator** で、招待を承認した Threads Tester を探し、右側の **Generate Access Token** をクリックします。",
        },
        {
          title: "認可を確認する",
          body: "認可ページには、App が取得する Threads 権限が表示されます。アカウントが正しいことを確認し、**Continue As …** をクリックします。",
          note: "**Edit access** を開く場合は、データと Insights の権限を有効のままにしてください。無効にすると、トークンは分析データを同期できなくなります。",
        },
        {
          title: "アクセストークンをコピーする",
          body: "Meta Developers に戻ると Token のダイアログが表示されます。**I understand** にチェックを入れ、**Copy** をクリックして Long-lived Threads アクセストークンをコピーします。",
        },
      ],
    },
  ],
  finish: {
    kicker: "トークンを手にしたら",
    title: "コ⁠ピ⁠ー⁠で⁠き⁠た⁠ら⁠、持⁠ち⁠帰⁠り⁠ま⁠し⁠ょ⁠う⁠。",
    description:
      "ダッシュボードの **Settings → Add Threads account** に貼り付けて、最初の同期を実行します。",
    expiry:
      "トークンの有効期限は 60 日ですが、ダッシュボードが同期時に自動で延長するため、このガイドを再度たどる必要はありません。アプリが長期間オフラインで期限切れになった場合のみ、同じ手順で再生成し、アカウントカードの **Update token** から貼り直してください。同期済みデータはそのまま残ります。",
    primary: "デプロイ方法を見る",
    secondary: "GitHub で見る",
  },
};

const mcpGuideEn: McpGuideCopy = {
  metadata: {
    title: "Threads MCP Server: Ask Claude or Cursor About Your Threads Data",
    description:
      "A built-in Threads MCP server. Connect Claude Code, Claude, Cursor, or any MCP client and ask about your posts, analytics, and followers. Read-only, OAuth-protected.",
  },
  hero: {
    kicker: "GUIDE / MCP SERVER",
    lineOne: "Threads MCP server:",
    lineTwo: "your data, one question away.",
    description:
      "Your dashboard ships an MCP server. Connect Claude Code, Claude, Codex, or Cursor and ask about your posts, analytics, and followers. Read-only, and you approve every connection.",
    primaryCta: "Connect your agent",
    secondaryCta: "What is MCP?",
    note: "About 2 minutes · No API keys · Read-only",
    endpointLabel: "YOUR MCP ENDPOINT",
    commandLabel: "CLAUDE CODE · ONE COMMAND",
    codexCommandLabel: "CODEX · ONE COMMAND",
    copy: "Copy",
    copied: "Copied",
    hint: "Replace your-deployment.example.com with your deployed dashboard's domain.",
    worksWith: "WORKS WITH",
    moreAgents: "+ any MCP client",
  },
  capabilities: {
    kicker: "01 / WHAT IT CAN DO",
    title: "Six read-only tools. Six report prompts.",
    description:
      "The server turns your synced data into structured tools. You ask in plain language; your agent picks the right tool and reads only what it needs.",
    panelBadge: "READ-ONLY",
    items: [
      {
        tag: "get_account_overview",
        index: "01",
        title: "See the account at a glance",
        body: "Every connected account's username, sync status, post count, data range, and follower growth summary — the first call every conversation starts with. With several accounts, the agent asks which one you mean.",
      },
      {
        tag: "list_posts · get_post",
        index: "02",
        title: "Search and read every post",
        body: "Filter by date, media type, or text, sort by views, likes, or engagement rate, then pull any post's full text.",
      },
      {
        tag: "get_analytics",
        index: "03",
        title: "31 analytics sections",
        body: "Best time to post, keyword analysis, posting streaks, views distribution, and more — computed over any date range you ask for.",
      },
      {
        tag: "get_follower_history",
        index: "04",
        title: "Follow the audience curve",
        body: "Daily follower snapshots with a growth summary, plus the latest country, city, age, and gender demographics.",
      },
      {
        tag: "compare_periods",
        index: "05",
        title: "Compare any two periods",
        body: "Posts, views, engagement, and follower growth side by side, with absolute and percentage changes.",
      },
      {
        tag: "6 built-in prompts",
        index: "06",
        title: "Reports, ready to run",
        body: "Performance review, content strategy, posting schedule, and three more — pick one from your client's prompt menu and get a full report back.",
      },
    ],
  },
  connect: {
    kicker: "02 / HOW TO CONNECT",
    title: "No API keys. Approve it in your browser.",
    description:
      "Authentication is OAuth 2.1 with PKCE and dynamic client registration: the client registers itself, your browser opens your dashboard's sign-in, and you approve access on a consent screen.",
    steps: [
      {
        index: "01",
        title: "Copy your endpoint",
        body: "The MCP server lives at /api/mcp on the dashboard you deployed — the same domain you sign in to, nothing extra to run.",
      },
      {
        index: "02",
        title: "Add it to your client",
        body: "One command in Claude Code or Codex, a custom connector in Claude, a URL entry in Cursor — switch between them below.",
      },
      {
        index: "03",
        title: "Sign in and approve",
        body: "Your browser opens the dashboard login. Approve the read-only scope and the agent is connected — revoke it anytime in Settings.",
      },
    ],
    clients: [
      {
        tag: "Claude Code",
        index: "01",
        title: "One command, then /mcp",
        body: "Run the one-line command — copyable at the top of this page — then run /mcp inside Claude Code and complete the sign-in when the browser opens.",
      },
      {
        tag: "Claude",
        index: "02",
        title: "Add a custom connector",
        body: "On claude.ai or in the desktop app, go to Settings → Connectors → Add custom connector, paste your endpoint URL, and finish the OAuth sign-in.",
      },
      {
        tag: "Codex",
        index: "03",
        title: "CLI or app settings",
        body: "Run the Codex command from the top of this page, then codex mcp login threads-analytics — or add it under the app's MCP settings, as shown here.",
      },
      {
        tag: "Cursor & others",
        index: "04",
        title: "Point any MCP client at it",
        body: "Add the endpoint as a url entry in .cursor/mcp.json — any client that supports Streamable HTTP with OAuth can connect.",
      },
    ],
    consent: {
      title: "The last step is always the same: authorize.",
      body: "Whichever client you use, your browser opens your dashboard's sign-in. Approve the read-only scope on this screen and the agent is connected.",
      connected: "Agent connected — read-only",
      dialog: {
        title: "Authorize access",
        subtitle: "Claude is asking to connect to your Threads Analytics.",
        scopeTitle: "This will allow the agent to:",
        scopeRead: "Read your posts, metrics, and analytics data",
        scopeNoWrite: "It cannot change any data or post on your behalf.",
        deny: "Deny",
        approve: "Authorize",
      },
    },
    manage: {
      title: "Connected once, revocable anytime.",
      body: "Every agent you approve shows up under Settings → Connected Agents on your dashboard, with when it was authorized and last used. Revoke wipes its tokens instantly — the client has to pass the consent screen again to reconnect.",
      panel: {
        title: "Connected agents",
        subtitle: "MCP clients you have authorized to read your analytics data.",
        revoke: "Revoke",
        agents: [
          { name: "Claude Code", meta: "Authorized Sep 4, 7:53 PM · Last used 8:21 PM" },
          { name: "Codex", meta: "Authorized Sep 4, 8:08 PM · Last used 8:09 PM" },
        ],
      },
    },
  },
  usage: {
    kicker: "03 / HOW TO USE IT",
    title: "Ask in your own words, or start from a prompt.",
    description:
      "Once connected, the tools appear automatically — there is nothing to configure. Ask anything about your account, or run one of the six built-in prompts; each takes an optional period like 30d or 90d.",
    examplesLabel: "TRY ASKING",
    examples: [
      {
        q: "Which of my posts this month had the best engagement rate — and why?",
        a: "Your top three by engagement rate are all question-led text posts — median 4.8%, 62% above your baseline. Short question plus your own answer is what drives the replies.",
        tools: ["list_posts", "get_post"],
      },
      {
        q: "When should I post next week? Base it on my last 90 days.",
        a: "Your audience is most active Tue and Thu, 8–10 PM — median views +41% over the last 90 days. Try Tue 8:30 PM and Thu 9:00 PM next week.",
        tools: ["get_account_overview", "get_analytics"],
      },
      {
        q: "Compare this month with last month and write a short report.",
        a: "This month: 18 posts (+3), 124K views (+22%), 3.9% engagement rate (+0.6pp), +214 followers. Full report below.",
        tools: ["compare_periods"],
      },
    ],
    examplesNote:
      "Your agent decides which tools to call — overview first, then posts, analytics, or follower history as needed.",
    promptsLabel: "PROMPT MENU",
    prompts: [
      {
        tag: "performance-review",
        index: "01",
        title: "Performance review",
        body: "Trends, your best and worst posts with likely reasons, and three concrete actions for the next period.",
      },
      {
        tag: "content-strategy",
        index: "02",
        title: "Content strategy",
        body: "Which formats, lengths, and topics work — and the content mix to publish going forward.",
      },
      {
        tag: "posting-schedule",
        index: "03",
        title: "Posting schedule",
        body: "A concrete weekly schedule built from when your audience actually engages.",
      },
      {
        tag: "viral-post-breakdown",
        index: "04",
        title: "Viral post breakdown",
        body: "Deep-dives your outlier posts and extracts the repeatable patterns behind them.",
      },
      {
        tag: "audience-insights",
        index: "05",
        title: "Audience insights",
        body: "Follower growth and demographics, and what they imply for content and timing.",
      },
      {
        tag: "topic-analysis",
        index: "06",
        title: "Topic analysis",
        body: "Which topics and writing patterns drive performance, plus five post ideas that apply them.",
      },
    ],
  },
  cta: {
    title: "Point your agent at your own data.",
    description:
      "Deploy the dashboard, connect the agent you already use, and your next performance report is one prompt away.",
    primary: "Connect your agent",
    secondary: "View on GitHub",
    revokeNote:
      "Every connected agent shows up in Settings → Connected Agents — revoke access with one click.",
  },
};

const mcpGuideZh: McpGuideCopy = {
  metadata: {
    title: "Threads MCP Server：讓 Claude、Cursor 等 AI Agent 直接問你的 Threads 數據",
    description:
      "內建 Threads MCP Server：連接 Claude Code、Claude、Cursor 或任何 MCP 客戶端，直接用 AI 問你的 Threads 貼文、數據與粉絲成長。唯讀存取、OAuth 保護、免 API Key。",
  },
  hero: {
    kicker: "教學 / MCP SERVER",
    // ⁠ word joiners +   pin the break points: line one never breaks,
    // line two only between 數據, 問一句 and 就能到手.
    lineOne: "Threads MCP，",
    lineTwo: "數⁠據問⁠一⁠句就⁠能⁠到⁠手⁠。",
    description:
      "你的 Dashboard 內建 MCP Server。連接 Claude Code、Claude、Codex 或 Cursor，就能直接問你的貼文、數據與粉絲紀錄。唯讀，每個連接都由你核准。",
    primaryCta: "開始連接 Agent",
    secondaryCta: "什麼是 MCP？",
    note: "約 2 分鐘 · 不需要 API Key · 唯讀存取",
    endpointLabel: "你的 MCP ENDPOINT",
    commandLabel: "CLAUDE CODE · 一行指令",
    codexCommandLabel: "CODEX · 一行指令",
    copy: "複製",
    copied: "已複製",
    hint: "把 your-deployment.example.com 換成你部署的 Dashboard 網域。",
    worksWith: "支援",
    moreAgents: "+ 任何 MCP 客戶端",
  },
  capabilities: {
    kicker: "01 / 它能做什麼",
    title: "六⁠個唯⁠讀⁠工⁠具⁠，六⁠個報⁠告 P⁠r⁠o⁠m⁠p⁠t⁠。",
    description:
      "MCP Server 把你同步好的數據整理成結構化工具。你用自然語言發問，Agent 自己挑選工具、只讀取需要的部分。",
    panelBadge: "唯讀",
    items: [
      {
        tag: "get_account_overview",
        index: "01",
        title: "一眼掌握帳號現況",
        body: "所有已連接帳號的名稱、同步狀態、貼文數、資料範圍與粉絲成長摘要 — 每段對話的第一個呼叫。有多個帳號時，Agent 會先問你要查哪一個。",
      },
      {
        tag: "list_posts · get_post",
        index: "02",
        title: "搜尋並閱讀每篇貼文",
        body: "依日期、媒體類型或文字篩選，依瀏覽、按讚或互動率排序，再取出任一篇貼文的完整內容。",
      },
      {
        tag: "get_analytics",
        index: "03",
        title: "31 個分析區塊隨選即用",
        body: "最佳發文時間、關鍵字分析、發文連續紀錄、瀏覽分佈等 — 依你指定的日期範圍即時計算。",
      },
      {
        tag: "get_follower_history",
        index: "04",
        title: "追蹤粉絲成長曲線",
        body: "每日粉絲快照與成長摘要，還能加上最新的國家、城市、年齡與性別輪廓。",
      },
      {
        tag: "compare_periods",
        index: "05",
        title: "比較任意兩個期間",
        body: "貼文、瀏覽、互動與粉絲成長並列呈現，附上絕對值與百分比變化。",
      },
      {
        tag: "6 個內建 Prompt",
        index: "06",
        title: "一鍵產出完整報告",
        body: "成效回顧、內容策略、發文排程等六種範本 — 在客戶端選單點一下，就能拿到完整報告。",
      },
    ],
  },
  connect: {
    kicker: "02 / 如何連接",
    title: "不⁠需⁠要 A⁠P⁠I K⁠e⁠y⁠，在⁠瀏⁠覽⁠器按⁠下⁠核⁠准就⁠好⁠。",
    description:
      "驗證採用 OAuth 2.1 with PKCE 與 Dynamic Client Registration：客戶端自動註冊，瀏覽器開啟你 Dashboard 的登入頁，由你在授權畫面親自核准。",
    steps: [
      {
        index: "01",
        title: "複製你的 Endpoint",
        body: "MCP Server 就在你部署的 Dashboard 的 /api/mcp — 跟你平常登入的是同一個網域，不需要多跑任何服務。",
      },
      {
        index: "02",
        title: "加入你的客戶端",
        body: "Claude Code 與 Codex 各一行指令、Claude 加一個 Custom Connector、Cursor 填一個 URL — 在下方切換查看各客戶端的做法。",
      },
      {
        index: "03",
        title: "登入並核准",
        body: "瀏覽器會開啟 Dashboard 登入頁。核准唯讀權限後 Agent 就連上了 — 隨時可以在 Settings 撤銷。",
      },
    ],
    clients: [
      {
        tag: "Claude Code",
        index: "01",
        title: "一行指令，再執行 /mcp",
        body: "執行一行指令（頁面上方可複製），接著在 Claude Code 裡輸入 /mcp，瀏覽器開啟後完成登入。",
      },
      {
        tag: "Claude",
        index: "02",
        title: "新增 Custom Connector",
        body: "在 claude.ai 或桌面版前往 Settings → Connectors → Add custom connector，貼上你的 Endpoint URL，完成 OAuth 登入。",
      },
      {
        tag: "Codex",
        index: "03",
        title: "CLI 或 App 設定都可以",
        body: "執行頁面上方的 Codex 指令，再執行 codex mcp login threads-analytics — 也可以像圖中一樣在 App 的 MCP 設定裡新增。",
      },
      {
        tag: "Cursor · 其他",
        index: "04",
        title: "任何 MCP 客戶端都能連",
        body: "在 .cursor/mcp.json 加入一筆 url 設定 — 任何支援 Streamable HTTP 與 OAuth 的客戶端都能連接。",
      },
    ],
    consent: {
      title: "最後一步都一樣：授權。",
      body: "無論用哪個客戶端，瀏覽器都會開啟你 Dashboard 的登入頁。在這個畫面核准唯讀權限後，Agent 就連上了。",
      connected: "Agent 已連接 — 唯讀存取",
      dialog: {
        title: "授權存取",
        subtitle: "Claude 想要連接你的 Threads Analytics。",
        scopeTitle: "這將允許該 agent：",
        scopeRead: "讀取你的貼文、數據與分析資料",
        scopeNoWrite: "它無法修改任何資料，也無法代替你發文。",
        deny: "拒絕",
        approve: "授權",
      },
    },
    manage: {
      title: "連接後，也隨時收得回來。",
      body: "每個核准過的 Agent 都會列在 Dashboard 的 Settings → Connected Agents，看得到授權時間與上次使用時間。點「撤銷」會立即作廢它的 Token — 客戶端要重新走一次授權畫面才能再連上。",
      panel: {
        title: "已連接的 agent",
        subtitle: "你已授權讀取分析資料的 MCP client。",
        revoke: "撤銷",
        agents: [
          { name: "Claude Code", meta: "授權於 9月4日 晚上7:53 · 上次使用 晚上8:21" },
          { name: "Codex", meta: "授權於 9月4日 晚上8:08 · 上次使用 晚上8:09" },
        ],
      },
    },
  },
  usage: {
    kicker: "03 / 如何使用",
    title: "用⁠自⁠己⁠的⁠話⁠問⁠，或⁠從 P⁠r⁠o⁠m⁠p⁠t 範⁠本開⁠始⁠。",
    description:
      "連接完成後工具會自動出現，不需要任何設定。直接詢問帳號的任何問題，或執行六個內建 Prompt；每個都能加上像 30d、90d 的期間參數。",
    examplesLabel: "試著這樣問",
    examples: [
      {
        q: "我這個月互動率最高的貼文是哪些？為什麼表現好？",
        a: "互動率前三名都是問句開頭的文字貼文 — 中位數 4.8%，比你的基準高 62%。短提問加上自己的回答，最能帶動回覆。",
        tools: ["list_posts", "get_post"],
      },
      {
        q: "下週什麼時候發文最好？用我過去 90 天的數據判斷。",
        a: "你的受眾在週二、週四晚上 8–10 點最活躍 — 過去 90 天中位觀看高出 41%。下週建議排週二 20:30 和週四 21:00。",
        tools: ["get_account_overview", "get_analytics"],
      },
      {
        q: "比較這個月和上個月，寫一份簡短報告。",
        a: "這個月：18 篇貼文（+3）、12.4 萬觀看（+22%）、互動率 3.9%（+0.6pp）、粉絲淨增 214。完整報告如下。",
        tools: ["compare_periods"],
      },
    ],
    examplesNote: "Agent 會自己決定呼叫哪些工具 — 先看帳號總覽，再視需要讀取貼文、分析或粉絲紀錄。",
    promptsLabel: "PROMPT 選單",
    prompts: [
      {
        tag: "performance-review",
        index: "01",
        title: "成效回顧",
        body: "整體趨勢、表現最好與最差的貼文及原因，加上下個期間的三個具體行動。",
      },
      {
        tag: "content-strategy",
        index: "02",
        title: "內容策略",
        body: "哪些形式、長度與主題有效 — 以及接下來該採用的內容配比。",
      },
      {
        tag: "posting-schedule",
        index: "03",
        title: "發文排程",
        body: "根據受眾實際互動的時段，排出具體的每週發文時間表。",
      },
      {
        tag: "viral-post-breakdown",
        index: "04",
        title: "爆紅貼文解析",
        body: "深入拆解表現突出的貼文，萃取可以重複使用的模式。",
      },
      {
        tag: "audience-insights",
        index: "05",
        title: "受眾洞察",
        body: "粉絲成長與輪廓數據，以及它們對內容與發文時間的意義。",
      },
      {
        tag: "topic-analysis",
        index: "06",
        title: "主題分析",
        body: "哪些主題與寫作模式帶動成效，並附上五個套用這些模式的貼文靈感。",
      },
    ],
  },
  cta: {
    title: "讓⁠你⁠的 A⁠g⁠e⁠n⁠t 讀⁠懂你⁠的⁠數⁠據⁠。",
    description: "部署 Dashboard、連接你慣用的 Agent，下一份成效報告只差一個 Prompt。",
    primary: "開始連接 Agent",
    secondary: "前往 GitHub",
    revokeNote: "所有連接中的 Agent 都會列在 Settings → Connected Agents，一鍵即可撤銷存取。",
  },
};

const mcpGuideJa: McpGuideCopy = {
  metadata: {
    title: "Threads MCP サーバー：Claude や Cursor などの AI エージェントから Threads データに質問",
    description:
      "Threads MCP サーバーを標準搭載。Claude Code、Claude、Cursor などの MCP クライアントを接続し、投稿・分析・フォロワーのデータに AI から直接質問。読み取り専用・OAuth 保護・API キー不要。",
  },
  hero: {
    kicker: "ガイド / MCP SERVER",
    // ⁠ word joiners +   pin the break points: line one never breaks,
    // line two only between データは, ひと言で and 手元に.
    lineOne: "Threads MCP で、",
    lineTwo: "デ⁠ー⁠タ⁠はひ⁠と⁠言⁠で手⁠元⁠に⁠。",
    description:
      "MCP サーバー内蔵。Claude Code、Claude、Codex、Cursor をつなげば、投稿・分析・フォロワーのデータに直接質問できます。読み取り専用で、接続はあなたが承認します。",
    primaryCta: "エージェントを接続する",
    secondaryCta: "MCP とは？",
    note: "約 2 分 · API キー不要 · 読み取り専用",
    endpointLabel: "あなたの MCP エンドポイント",
    commandLabel: "CLAUDE CODE · コマンド 1 行",
    codexCommandLabel: "CODEX · コマンド 1 行",
    copy: "コピー",
    copied: "コピーしました",
    hint: "your-deployment.example.com をデプロイ済みダッシュボードのドメインに置き換えてください。",
    worksWith: "対応クライアント",
    moreAgents: "+ 任意の MCP クライアント",
  },
  capabilities: {
    kicker: "01 / できること",
    title: "読⁠み⁠取⁠り⁠専⁠用ツ⁠ー⁠ル 6 つ⁠、レ⁠ポ⁠ー⁠トプ⁠ロ⁠ン⁠プ⁠ト 6 つ⁠。",
    description:
      "MCP サーバーは同期済みデータを構造化ツールとして公開します。自然な言葉で質問するだけで、エージェントが必要なツールを選び、必要な分だけ読み取ります。",
    panelBadge: "読み取り専用",
    items: [
      {
        tag: "get_account_overview",
        index: "01",
        title: "アカウントをひと目で把握",
        body: "接続済み全アカウントのユーザー名、同期状態、投稿数、データ範囲、フォロワー成長サマリー — どの会話も最初に呼ぶツールです。複数アカウントがある場合、エージェントがどれを見るか尋ねます。",
      },
      {
        tag: "list_posts · get_post",
        index: "02",
        title: "すべての投稿を検索・閲覧",
        body: "日付・メディアタイプ・テキストで絞り込み、閲覧数・いいね・エンゲージメント率で並べ替え、任意の投稿の全文を取得。",
      },
      {
        tag: "get_analytics",
        index: "03",
        title: "31 種類の分析セクション",
        body: "最適な投稿時間、キーワード分析、投稿ストリーク、閲覧数分布など — 指定した期間でその場で計算します。",
      },
      {
        tag: "get_follower_history",
        index: "04",
        title: "フォロワーの推移を追う",
        body: "日次フォロワースナップショットと成長サマリー、さらに最新の国・都市・年齢・性別の内訳も取得できます。",
      },
      {
        tag: "compare_periods",
        index: "05",
        title: "任意の 2 期間を比較",
        body: "投稿数・閲覧数・エンゲージメント・フォロワー成長を並べて、実数と変化率で比較します。",
      },
      {
        tag: "内蔵プロンプト 6 種",
        index: "06",
        title: "レポートはワンクリック",
        body: "パフォーマンスレビュー、コンテンツ戦略、投稿スケジュールなど 6 種類 — クライアントのメニューから選ぶだけで完全なレポートが届きます。",
      },
    ],
  },
  connect: {
    kicker: "02 / 接続方法",
    title: "A⁠P⁠I キ⁠ー⁠は不⁠要⁠。ブ⁠ラ⁠ウ⁠ザ⁠で承⁠認⁠す⁠る⁠だ⁠け⁠。",
    description:
      "認証は OAuth 2.1（PKCE）と Dynamic Client Registration。クライアントが自動で登録し、ブラウザにダッシュボードのログイン画面が開き、同意画面であなたが承認します。",
    steps: [
      {
        index: "01",
        title: "エンドポイントをコピー",
        body: "MCP サーバーはデプロイ済みダッシュボードの /api/mcp にあります。いつもログインしているドメインと同じで、追加のサービスは不要です。",
      },
      {
        index: "02",
        title: "クライアントに追加",
        body: "Claude Code と Codex はコマンド 1 行、Claude はカスタムコネクタ、Cursor は URL の設定 1 つ — 下で切り替えて確認できます。",
      },
      {
        index: "03",
        title: "ログインして承認",
        body: "ブラウザにダッシュボードのログインが開きます。読み取り専用スコープを承認すれば接続完了 — いつでも Settings から取り消せます。",
      },
    ],
    clients: [
      {
        tag: "Claude Code",
        index: "01",
        title: "コマンド 1 行、それから /mcp",
        body: "コマンド 1 行を実行し（ページ上部でコピーできます）、Claude Code 内で /mcp を実行して、開いたブラウザでログインを完了します。",
      },
      {
        tag: "Claude",
        index: "02",
        title: "カスタムコネクタを追加",
        body: "claude.ai またはデスクトップアプリで Settings → Connectors → Add custom connector を開き、エンドポイント URL を貼り付けて OAuth ログインを完了します。",
      },
      {
        tag: "Codex",
        index: "03",
        title: "CLI でもアプリ設定でも",
        body: "ページ上部の Codex コマンドを実行し、codex mcp login threads-analytics を実行 — 図のようにアプリの MCP 設定から追加もできます。",
      },
      {
        tag: "Cursor · その他",
        index: "04",
        title: "任意の MCP クライアントで",
        body: ".cursor/mcp.json に url エントリを追加 — Streamable HTTP と OAuth に対応するクライアントなら何でも接続できます。",
      },
    ],
    consent: {
      title: "最後のステップは共通：許可するだけ。",
      body: "どのクライアントでも、ブラウザにダッシュボードのログインが開きます。この画面で読み取り専用スコープを許可すれば、接続は完了です。",
      connected: "エージェント接続済み — 読み取り専用",
      dialog: {
        title: "アクセスを許可",
        subtitle: "Claude が Threads Analytics への接続を求めています。",
        scopeTitle: "このエージェントに以下を許可します：",
        scopeRead: "投稿・メトリクス・分析データの読み取り",
        scopeNoWrite: "データの変更や、あなたに代わっての投稿はできません。",
        deny: "拒否",
        approve: "許可",
      },
    },
    manage: {
      title: "接続後も、いつでも取り消せる。",
      body: "許可したエージェントはダッシュボードの Settings → Connected Agents に一覧表示され、許可日時と最終使用日時を確認できます。「取り消す」でトークンは即座に無効化され、再接続には同意画面をもう一度通す必要があります。",
      panel: {
        title: "接続済みエージェント",
        subtitle: "分析データの読み取りを許可した MCP クライアント。",
        revoke: "取り消す",
        agents: [
          { name: "Claude Code", meta: "許可日 9月4日 19:53 · 最終使用 20:21" },
          { name: "Codex", meta: "許可日 9月4日 20:08 · 最終使用 20:09" },
        ],
      },
    },
  },
  usage: {
    kicker: "03 / 使い方",
    title: "自⁠分⁠の⁠言⁠葉⁠で質⁠問⁠す⁠る⁠か⁠、プ⁠ロ⁠ン⁠プ⁠ト⁠か⁠ら始⁠め⁠る⁠。",
    description:
      "接続すればツールは自動で現れ、設定は不要です。アカウントについて何でも質問するか、6 つの内蔵プロンプトを実行してください。どれも 30d や 90d のような期間指定に対応します。",
    examplesLabel: "こんな質問を",
    examples: [
      {
        q: "今月エンゲージメント率が最も高かった投稿はどれ？理由も教えて。",
        a: "上位 3 件はすべて質問で始まるテキスト投稿 — 中央値 4.8%、ベースライン比 +62%。短い問いかけと自答の形式が返信を伸ばしています。",
        tools: ["list_posts", "get_post"],
      },
      {
        q: "来週はいつ投稿すべき？過去 90 日のデータで判断して。",
        a: "オーディエンスは火・木の 20〜22 時が最も活発 — 90 日間の中央値ビューは +41%。来週は火 20:30 と木 21:00 がおすすめです。",
        tools: ["get_account_overview", "get_analytics"],
      },
      {
        q: "今月と先月を比較して、短いレポートを書いて。",
        a: "今月：18 投稿（+3）、閲覧 12.4 万（+22%）、エンゲージ率 3.9%（+0.6pp）、フォロワー +214。詳細レポートは以下の通り。",
        tools: ["compare_periods"],
      },
    ],
    examplesNote:
      "どのツールを呼ぶかはエージェントが判断します — まず概要を見て、必要に応じて投稿・分析・フォロワー履歴を読み取ります。",
    promptsLabel: "プロンプトメニュー",
    prompts: [
      {
        tag: "performance-review",
        index: "01",
        title: "パフォーマンスレビュー",
        body: "全体トレンド、ベスト/ワースト投稿とその理由、次の期間への具体的なアクション 3 つ。",
      },
      {
        tag: "content-strategy",
        index: "02",
        title: "コンテンツ戦略",
        body: "どの形式・長さ・トピックが効いているか — そして今後の最適なコンテンツ配分。",
      },
      {
        tag: "posting-schedule",
        index: "03",
        title: "投稿スケジュール",
        body: "オーディエンスが実際に反応する時間帯から、具体的な週間スケジュールを提案。",
      },
      {
        tag: "viral-post-breakdown",
        index: "04",
        title: "バズ投稿の分解",
        body: "突出した投稿を深掘りし、再現可能なパターンを抽出します。",
      },
      {
        tag: "audience-insights",
        index: "05",
        title: "オーディエンス分析",
        body: "フォロワー成長と属性データ、そしてコンテンツと投稿時間への示唆。",
      },
      {
        tag: "topic-analysis",
        index: "06",
        title: "トピック分析",
        body: "成果を生むトピックと文章パターン、それを応用した投稿アイデア 5 つ。",
      },
    ],
  },
  cta: {
    title: "エ⁠ー⁠ジ⁠ェ⁠ン⁠ト⁠に⁠、自⁠分⁠の⁠デ⁠ー⁠タ⁠を⁠。",
    description:
      "ダッシュボードをデプロイし、いつものエージェントを接続すれば、次のレポートはプロンプト 1 つの距離です。",
    primary: "エージェントを接続する",
    secondary: "GitHub で見る",
    revokeNote:
      "接続中のエージェントは Settings → Connected Agents に表示され、ワンクリックで取り消せます。",
  },
};

const giveawayGuideEn: GiveawayGuideCopy = {
  metadata: {
    title: "Threads Giveaway Picker: Draw Winners from Post Replies",
    description:
      "Free Threads giveaway picker: load a post's replies, apply the entry rules you announced, and draw winners with a cryptographic shuffle. Self-hosted, no bot.",
  },
  hero: {
    kicker: "FEATURE / GIVEAWAY",
    lineOne: "Threads giveaway picker:",
    lineTwo: "your replies are the entries.",
    description:
      "Pick a post, load its replies, filter by the rules you announced, then draw. No giveaway bot to authorize, and the entry list never leaves your server.",
    primaryCta: "Try a draw",
    secondaryCta: "Deploy the dashboard",
    note: "Built in · Cryptographic shuffle · Nothing leaves your server",
    hint: "Loading replies needs an access token with the threads_read_replies permission.",
    resultCard: {
      label: "DRAW RESULTS",
      badge: "FAIR DRAW",
      shuffling: "Shuffling entries…",
      summary: "3 winners from 248 eligible entries",
      prizes: [
        { name: "Mechanical keyboard × 1", winners: ["@mina.codes"] },
        { name: "Sticker pack × 2", winners: ["@leo.writes", "@hana.builds"] },
      ],
      replay: "Draw again",
    },
  },
  how: {
    kicker: "01 / HOW IT WORKS",
    title: "Four steps from a post to a winner.",
    description:
      "Everything runs on the dashboard you deployed, against the posts you already sync — the same place you read your analytics.",
    steps: [
      {
        index: "01",
        title: "Pick the post",
        body: "Choose any synced post from the picker. The tool walks the Threads conversation endpoint page by page and loads up to 10,000 replies.",
      },
      {
        index: "02",
        title: "Set your conditions",
        body: "Switch on the rules you announced. Each one narrows the pool and the eligible counter updates as you type, so you know what you are drawing from.",
      },
      {
        index: "03",
        title: "Add the prizes",
        body: "Name each prize and how many winners it takes. One draw can hand out a grand prize and a batch of runner-ups at the same time.",
      },
      {
        index: "04",
        title: "Draw and announce",
        body: "Winners come out of a cryptographic shuffle. Copy the formatted result and paste it straight into your announcement reply.",
      },
    ],
  },
  conditions: {
    kicker: "02 / ENTRY CONDITIONS",
    title: "The rules you announced, applied to every reply.",
    description:
      "Conditions stack. Turn on what you promised in the post, and the panel tells you how many entries survive before anything is drawn.",
    panelBadge: "STACKABLE",
    items: [
      {
        tag: "one-per-account",
        index: "01",
        title: "One entry per account",
        body: "Someone who replied nine times counts once. Their first qualifying reply is the one that stays in the pool.",
      },
      {
        tag: "keyword",
        index: "02",
        title: "Must include a keyword",
        body: "Require a hashtag or phrase. Comma-separate several and a reply qualifies if it contains any one of them.",
      },
      {
        tag: "mentions",
        index: "03",
        title: "Must tag friends",
        body: "Set how many @mentions a reply needs — the classic tag-two-friends rule, counted automatically instead of by eye.",
      },
      {
        tag: "deadline",
        index: "04",
        title: "Replied before a deadline",
        body: "Pick the exact cutoff. Anything that arrived after your stated closing time drops out of the pool.",
      },
      {
        tag: "has-text",
        index: "05",
        title: "Must have comment text",
        body: "Empty replies and bare reposts are filtered out, so a blank entry can't take a prize.",
      },
      {
        tag: "exclude",
        index: "06",
        title: "Exclude specific accounts",
        body: "Search the entrant list and remove alt accounts, teammates, or previous winners. Your own replies are excluded before the list is even built.",
      },
    ],
  },
  demo: {
    kicker: "03 / TRY A DRAW",
    title: "Toggle the rules. Watch the pool change. Draw.",
    description:
      "A working replica of the giveaway panel with twelve sample replies. Every switch filters the list in real time, and the draw runs the same cryptographic shuffle the product ships.",
    panel: {
      conditionsLabel: "ENTRY CONDITIONS",
      prizesLabel: "PRIZES",
      entriesLabel: "ENTRIES",
      eligibleLabel: "eligible",
      filteredLabel: "filtered out",
      drawLabel: "Draw winners",
      drawingLabel: "Drawing…",
      redrawLabel: "Draw again",
      resultsLabel: "WINNERS",
      emptyLabel: "No draw yet — set your conditions, then draw.",
      summary: "Drew {won} from {pool} eligible entries",
      conditions: [
        {
          id: "dedupe",
          label: "One entry per account",
          hint: "Repeat replies collapse into one",
        },
        {
          id: "keyword",
          label: "Must include #giveaway",
          hint: "Comma-separate to accept any of several",
        },
        {
          id: "mentions",
          label: "Must tag 2 friends",
          hint: "Counts the @mentions in each reply",
        },
        {
          id: "deadline",
          label: "Replied before 21:00",
          hint: "Late entries drop out of the pool",
        },
      ],
      prizes: [
        { name: "Mechanical keyboard", count: 1 },
        { name: "Sticker pack", count: 2 },
      ],
      entries: [
        {
          user: "mina.codes",
          text: "#giveaway count me in @leo.writes @hana.builds",
          mentions: 2,
          keyword: true,
        },
        {
          user: "leo.writes",
          text: "#giveaway been waiting for this one @mina.codes @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "hana.builds",
          text: "#giveaway @sora.ui @kai.exe you two need this",
          mentions: 2,
          keyword: true,
        },
        { user: "noah.dev", text: "count me in!", mentions: 0, keyword: false },
        { user: "sora.ui", text: "#giveaway @kai.exe", mentions: 1, keyword: true },
        {
          user: "mina.codes",
          text: "#giveaway bumping this @sora.ui @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "kai.exe",
          text: "#giveaway 🎉 @mina.codes @leo.writes",
          mentions: 2,
          keyword: true,
        },
        {
          user: "ava.design",
          text: "#giveaway just made it @hana.builds @noah.dev",
          mentions: 2,
          keyword: true,
          late: true,
        },
        { user: "yuki.md", text: "love this dashboard", mentions: 0, keyword: false },
        {
          user: "theo.ships",
          text: "#giveaway @ava.design @yuki.md joining in",
          mentions: 2,
          keyword: true,
        },
        { user: "lila.dev", text: "#giveaway @theo.ships", mentions: 1, keyword: true },
        {
          user: "ren.tech",
          text: "#giveaway @lila.dev @yuki.md good luck everyone",
          mentions: 2,
          keyword: true,
        },
      ],
    },
    note: "Sample replies, real logic. On your deployment the panel reads the actual thread of the post you pick.",
  },
  fairness: {
    kicker: "04 / WHY IT'S FAIR",
    title: "Randomness you can explain, on a server you own.",
    description:
      "A giveaway is only worth running if the people who entered believe the result. Here is exactly what happens between the reply list and the winner.",
    items: [
      {
        index: "01",
        title: "A shuffle, not a guess",
        body: "Winners come out of a Fisher–Yates shuffle driven by crypto.getRandomValues, the browser's cryptographic generator. Every eligible entry carries the same odds, and no account wins twice in one draw.",
      },
      {
        index: "02",
        title: "Your own replies never enter",
        body: "The host's replies are dropped on the server before the pool is built, so answering entrants in the thread can't put you in your own giveaway.",
      },
      {
        index: "03",
        title: "What the API can't check",
        body: "Threads only exposes replies. Repost, follow, and like requirements have to be confirmed by hand on the winners — the panel says so instead of pretending otherwise.",
      },
      {
        index: "04",
        title: "Nothing leaves your deployment",
        body: "Replies are fetched with your own encrypted token and filtered in your browser. No third-party giveaway service ever sees your entrants.",
      },
    ],
    tokenNote:
      "Replies need an access token with the threads_read_replies permission — the token guide covers it step by step.",
    tokenCta: "Read the token guide",
  },
  cta: {
    title: "Run your next giveaway on your own dashboard.",
    description:
      "Deploy Threads Analytics, connect your Threads account, and the giveaway panel is already waiting in the sidebar — nothing else to install.",
    primary: "Deploy the dashboard",
    secondary: "View on GitHub",
    note: "Entries, conditions, and results all stay on your deployment.",
  },
};

const giveawayGuideZh: GiveawayGuideCopy = {
  metadata: {
    title: "免費 Threads 抽獎工具：從貼文留言隨機抽出得獎者",
    description:
      "免費的 Threads 抽獎工具：選一則貼文、載入全部留言、套用你公告過的抽獎條件（關鍵字、標記朋友、截止時間），再用密碼學等級的洗牌隨機抽出得獎者。完全自架，不用授權第三方抽獎機器人。",
  },
  hero: {
    kicker: "功能 / 抽獎",
    // \u2060 word joiners pin the break points: line one only breaks after Threads,
    // line two only between 留言, 就是你的 and 抽獎池.
    lineOne: "Threads 抽⁠獎⁠工⁠具⁠，",
    lineTwo: "留⁠言就⁠是⁠你⁠的抽⁠獎⁠池⁠。",
    description:
      "選一則貼文、載入全部留言、依你公告過的規則篩選，然後開獎。不用授權第三方抽獎機器人，名單也不會離開你的伺服器。",
    primaryCta: "試抽一次",
    secondaryCta: "部署 Dashboard",
    note: "內建功能 · 密碼學洗牌 · 資料不出你的伺服器",
    hint: "載入留言需要具備 threads_read_replies 權限的 Access Token。",
    resultCard: {
      label: "開獎結果",
      badge: "公平抽獎",
      shuffling: "洗牌中…",
      summary: "從 248 位符合資格者中抽出 3 位",
      prizes: [
        { name: "機械鍵盤 × 1", winners: ["@mina.codes"] },
        { name: "貼紙組 × 2", winners: ["@leo.writes", "@hana.builds"] },
      ],
      replay: "重新抽一次",
    },
  },
  how: {
    kicker: "01 / 怎麼運作",
    title: "從⁠一⁠則⁠貼⁠文到⁠得⁠獎⁠者⁠，四⁠個⁠步⁠驟⁠。",
    description:
      "全部都在你自己部署的 Dashboard 上執行，資料來自你早就同步好的貼文 — 和你看分析報表的是同一個地方。",
    steps: [
      {
        index: "01",
        title: "選擇貼文",
        body: "從選單挑一則已同步的貼文。工具會逐頁呼叫 Threads 的 conversation 端點，最多載入 10,000 則留言。",
      },
      {
        index: "02",
        title: "設定抽獎條件",
        body: "打開你公告過的規則。每多一個條件就收窄一次名單，符合資格的人數會即時更新，讓你清楚知道自己在從多少人裡面抽。",
      },
      {
        index: "03",
        title: "加入獎項",
        body: "填上獎項名稱和要抽幾位。一次開獎可以同時抽出大獎和好幾個加碼獎。",
      },
      {
        index: "04",
        title: "開獎並公告",
        body: "得獎者由密碼學洗牌抽出。複製排版好的結果，直接貼進你的公告留言。",
      },
    ],
  },
  conditions: {
    kicker: "02 / 抽獎條件",
    title: "你⁠公⁠告⁠的⁠規⁠則⁠，逐⁠則⁠留⁠言自⁠動⁠核⁠對⁠。",
    description:
      "條件可以疊加。把你在貼文裡答應過的規則打開，面板會先告訴你還剩多少人符合資格，再開獎。",
    panelBadge: "可疊加",
    items: [
      {
        tag: "one-per-account",
        index: "01",
        title: "同一帳號只算一次",
        body: "留了九次言的人也只佔一個名額，保留他第一則符合條件的留言留在抽獎池裡。",
      },
      {
        tag: "keyword",
        index: "02",
        title: "必須包含關鍵字",
        body: "要求特定 hashtag 或字串。用逗號分隔多組，留言只要命中其中一組就算符合。",
      },
      {
        tag: "mentions",
        index: "03",
        title: "必須標記朋友",
        body: "設定留言至少要有幾個 @ 標記 — 經典的「標記兩位朋友」規則，交給程式數，不用自己一則一則看。",
      },
      {
        tag: "deadline",
        index: "04",
        title: "須在截止時間前留言",
        body: "指定精確的截止時刻。在你公告的結束時間之後才進來的留言會自動退出抽獎池。",
      },
      {
        tag: "has-text",
        index: "05",
        title: "必須有留言內容",
        body: "空白留言與純轉發會被濾掉，避免一則空的留言抽走獎品。",
      },
      {
        tag: "exclude",
        index: "06",
        title: "排除指定帳號",
        body: "搜尋參加者名單，移除分身、同事或上次的得獎者。你自己的留言在名單成形前就已經被排除。",
      },
    ],
  },
  demo: {
    kicker: "03 / 試抽一次",
    title: "切⁠換⁠條⁠件⁠，看⁠名⁠單⁠變⁠化⁠，然⁠後⁠開⁠獎⁠。",
    description:
      "這是抽獎面板的可操作復刻，裡面有 12 則範例留言。每個開關都會即時篩選名單，開獎用的也是產品實際採用的密碼學洗牌。",
    panel: {
      conditionsLabel: "抽獎條件",
      prizesLabel: "獎項",
      entriesLabel: "留言名單",
      eligibleLabel: "符合資格",
      filteredLabel: "已篩除",
      drawLabel: "開始抽獎",
      drawingLabel: "抽獎中…",
      redrawLabel: "重新抽一次",
      resultsLabel: "得獎者",
      emptyLabel: "還沒開獎 — 設好條件後按下開始抽獎。",
      summary: "從 {pool} 位符合資格者中抽出 {won} 位",
      conditions: [
        {
          id: "dedupe",
          label: "同一帳號只算一次",
          hint: "重複留言合併為一筆",
        },
        {
          id: "keyword",
          label: "必須包含 #giveaway",
          hint: "用逗號分隔可接受任一關鍵字",
        },
        {
          id: "mentions",
          label: "必須標記 2 位朋友",
          hint: "計算每則留言裡的 @ 標記數",
        },
        {
          id: "deadline",
          label: "須在 21:00 前留言",
          hint: "逾時留言會退出抽獎池",
        },
      ],
      prizes: [
        { name: "機械鍵盤", count: 1 },
        { name: "貼紙組", count: 2 },
      ],
      entries: [
        {
          user: "mina.codes",
          text: "#giveaway 算我一份 @leo.writes @hana.builds",
          mentions: 2,
          keyword: true,
        },
        {
          user: "leo.writes",
          text: "#giveaway 等這個好久了 @mina.codes @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "hana.builds",
          text: "#giveaway @sora.ui @kai.exe 你們兩個超需要",
          mentions: 2,
          keyword: true,
        },
        { user: "noah.dev", text: "算我一個！", mentions: 0, keyword: false },
        { user: "sora.ui", text: "#giveaway @kai.exe", mentions: 1, keyword: true },
        {
          user: "mina.codes",
          text: "#giveaway 再推一次 @sora.ui @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "kai.exe",
          text: "#giveaway 🎉 @mina.codes @leo.writes",
          mentions: 2,
          keyword: true,
        },
        {
          user: "ava.design",
          text: "#giveaway 趕上了 @hana.builds @noah.dev",
          mentions: 2,
          keyword: true,
          late: true,
        },
        { user: "yuki.md", text: "這個 Dashboard 做得真好", mentions: 0, keyword: false },
        {
          user: "theo.ships",
          text: "#giveaway @ava.design @yuki.md 一起來",
          mentions: 2,
          keyword: true,
        },
        { user: "lila.dev", text: "#giveaway @theo.ships", mentions: 1, keyword: true },
        {
          user: "ren.tech",
          text: "#giveaway @lila.dev @yuki.md 大家好運",
          mentions: 2,
          keyword: true,
        },
      ],
    },
    note: "留言是範例，邏輯是真的。在你的部署上，面板讀的是你選定貼文底下的實際留言串。",
  },
  fairness: {
    kicker: "04 / 為什麼公平",
    title: "說⁠得⁠清⁠楚⁠的隨⁠機⁠，跑⁠在你⁠自⁠己⁠的伺⁠服⁠器⁠上⁠。",
    description:
      "抽獎要辦得有意義，前提是參加的人相信結果。以下就是從留言名單到得獎者之間，實際發生的每一件事。",
    items: [
      {
        index: "01",
        title: "是洗牌，不是隨便挑",
        body: "得獎者來自以 crypto.getRandomValues（瀏覽器的密碼學亂數產生器）驅動的 Fisher–Yates 洗牌。每一筆符合資格的留言機率相同，同一場抽獎裡也不會有帳號中兩次。",
      },
      {
        index: "02",
        title: "你自己的留言不會進名單",
        body: "主辦帳號的留言會在伺服器端就先被移除，所以你在留言串裡回覆參加者，不會把自己抽進自己的抽獎。",
      },
      {
        index: "03",
        title: "API 驗不了的事",
        body: "Threads 只開放留言資料。轉發、追蹤、按讚這類條件必須在開獎後對得獎者人工確認 — 面板會直接把這件事寫出來，而不是假裝做得到。",
      },
      {
        index: "04",
        title: "資料不離開你的部署",
        body: "留言用你自己加密保存的 Token 取得，篩選在你的瀏覽器裡完成。沒有任何第三方抽獎服務看得到你的參加者名單。",
      },
    ],
    tokenNote:
      "載入留言需要具備 threads_read_replies 權限的 Access Token — Token 生成教學會一步一步帶你完成。",
    tokenCta: "看 Token 生成教學",
  },
  cta: {
    title: "下⁠一⁠場⁠抽⁠獎⁠，就⁠在你⁠自⁠己⁠的 D⁠a⁠s⁠h⁠b⁠o⁠a⁠r⁠d 開⁠。",
    description:
      "部署 Threads Analytics、連接 Threads 帳號，抽獎面板就已經在側邊欄等你了 — 不需要再安裝任何東西。",
    primary: "部署 Dashboard",
    secondary: "在 GitHub 上查看",
    note: "留言、條件與開獎結果，全都留在你自己的部署裡。",
  },
};

const giveawayGuideJa: GiveawayGuideCopy = {
  metadata: {
    title: "Threads 抽選ツール：投稿のリプライから当選者をランダム抽出",
    description:
      "無料の Threads 抽選ツール。投稿を選び、リプライを読み込み、告知した応募条件（キーワード、友達のタグ付け、締切）で絞り込んで、暗号学的シャッフルで当選者を抽出。セルフホストなので抽選ボットの認可は不要です。",
  },
  hero: {
    kicker: "機能 / 抽選",
    // \u2060 word joiners pin the break points: line one only breaks after Threads,
    // line two only between リプライが and 応募一覧に.
    lineOne: "Threads 抽⁠選⁠ツ⁠ー⁠ル⁠で⁠、",
    lineTwo: "リ⁠プ⁠ラ⁠イ⁠が応⁠募⁠一⁠覧⁠に⁠。",
    description:
      "投稿を選び、リプライを読み込み、告知したルールで絞り込んで抽選。抽選ボットの認可は不要で、応募者リストはサーバーの外に出ません。",
    primaryCta: "抽選を試す",
    secondaryCta: "ダッシュボードをデプロイ",
    note: "標準搭載 · 暗号学的シャッフル · データは外に出ない",
    hint: "リプライの読み込みには threads_read_replies 権限を持つアクセストークンが必要です。",
    resultCard: {
      label: "抽選結果",
      badge: "公正な抽選",
      shuffling: "シャッフル中…",
      summary: "対象 248 件から 3 名を抽選",
      prizes: [
        { name: "メカニカルキーボード × 1", winners: ["@mina.codes"] },
        { name: "ステッカーセット × 2", winners: ["@leo.writes", "@hana.builds"] },
      ],
      replay: "もう一度抽選",
    },
  },
  how: {
    kicker: "01 / 仕組み",
    title: "投⁠稿⁠か⁠ら当⁠選⁠者⁠ま⁠で⁠、4 ス⁠テ⁠ッ⁠プ⁠。",
    description:
      "すべては自分でデプロイしたダッシュボード上で、すでに同期済みの投稿に対して実行されます — 分析を見ているのと同じ場所です。",
    steps: [
      {
        index: "01",
        title: "投稿を選ぶ",
        body: "同期済みの投稿をセレクタから選びます。Threads の conversation エンドポイントをページ送りしながら、最大 10,000 件のリプライを読み込みます。",
      },
      {
        index: "02",
        title: "応募条件を設定する",
        body: "告知したルールをオンにします。条件を足すたびに母数が絞られ、対象件数がその場で更新されるので、何件から抽選するのかが常に分かります。",
      },
      {
        index: "03",
        title: "賞品を追加する",
        body: "賞品名と当選人数を入力します。1 回の抽選で大賞と追加賞をまとめて抽出できます。",
      },
      {
        index: "04",
        title: "抽選して発表する",
        body: "当選者は暗号学的シャッフルで決まります。整形済みの結果をコピーして、そのまま発表のリプライに貼り付けてください。",
      },
    ],
  },
  conditions: {
    kicker: "02 / 応募条件",
    title: "告⁠知⁠し⁠たル⁠ー⁠ル⁠を⁠、す⁠べ⁠て⁠のリ⁠プ⁠ラ⁠イ⁠に自⁠動⁠で⁠適⁠用⁠。",
    description:
      "条件は重ねられます。投稿で約束したルールをオンにすると、抽選前に何件が対象として残るかをパネルが教えてくれます。",
    panelBadge: "重ねがけ可能",
    items: [
      {
        tag: "one-per-account",
        index: "01",
        title: "1 アカウント 1 口",
        body: "9 回リプライした人も 1 口として扱い、条件を満たした最初のリプライだけが母集団に残ります。",
      },
      {
        tag: "keyword",
        index: "02",
        title: "キーワードを含むこと",
        body: "特定のハッシュタグや語句を必須にします。カンマ区切りで複数指定すると、いずれかを含めば対象になります。",
      },
      {
        tag: "mentions",
        index: "03",
        title: "友達をタグ付けすること",
        body: "必要な @メンション数を設定します。定番の「友達 2 人をタグ付け」も、目視ではなく自動でカウントします。",
      },
      {
        tag: "deadline",
        index: "04",
        title: "締切前のリプライであること",
        body: "締切時刻を正確に指定できます。告知した終了時刻より後に届いたリプライは母集団から外れます。",
      },
      {
        tag: "has-text",
        index: "05",
        title: "コメント本文があること",
        body: "空のリプライや本文のないリポストを除外し、中身のない応募が当選しないようにします。",
      },
      {
        tag: "exclude",
        index: "06",
        title: "特定のアカウントを除外",
        body: "応募者リストを検索して、サブアカウント・関係者・前回の当選者を外せます。あなた自身のリプライはリスト作成前に除外済みです。",
      },
    ],
  },
  demo: {
    kicker: "03 / 抽選を試す",
    title: "条⁠件⁠を切⁠り⁠替⁠え⁠、母⁠数⁠の⁠変⁠化⁠を見⁠て⁠、抽⁠選⁠す⁠る⁠。",
    description:
      "12 件のサンプルリプライを使った、抽選パネルの実動レプリカです。スイッチを切り替えるたびにリストが即座に絞り込まれ、抽選には製品と同じ暗号学的シャッフルを使っています。",
    panel: {
      conditionsLabel: "応募条件",
      prizesLabel: "賞品",
      entriesLabel: "応募リプライ",
      eligibleLabel: "対象",
      filteredLabel: "除外",
      drawLabel: "抽選する",
      drawingLabel: "抽選中…",
      redrawLabel: "もう一度抽選",
      resultsLabel: "当選者",
      emptyLabel: "まだ抽選していません — 条件を設定して抽選してください。",
      summary: "対象 {pool} 件から {won} 名を抽選",
      conditions: [
        {
          id: "dedupe",
          label: "1 アカウント 1 口",
          hint: "重複リプライは 1 件にまとめます",
        },
        {
          id: "keyword",
          label: "#giveaway を含むこと",
          hint: "カンマ区切りでいずれかを許可",
        },
        {
          id: "mentions",
          label: "友達を 2 人タグ付け",
          hint: "各リプライの @メンション数を数えます",
        },
        {
          id: "deadline",
          label: "21:00 より前のリプライ",
          hint: "締切後の応募は母集団から外れます",
        },
      ],
      prizes: [
        { name: "メカニカルキーボード", count: 1 },
        { name: "ステッカーセット", count: 2 },
      ],
      entries: [
        {
          user: "mina.codes",
          text: "#giveaway 参加します @leo.writes @hana.builds",
          mentions: 2,
          keyword: true,
        },
        {
          user: "leo.writes",
          text: "#giveaway ずっと待ってました @mina.codes @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "hana.builds",
          text: "#giveaway @sora.ui @kai.exe 二人にこそ必要",
          mentions: 2,
          keyword: true,
        },
        { user: "noah.dev", text: "参加したいです！", mentions: 0, keyword: false },
        { user: "sora.ui", text: "#giveaway @kai.exe", mentions: 1, keyword: true },
        {
          user: "mina.codes",
          text: "#giveaway もう一度あげておきます @sora.ui @noah.dev",
          mentions: 2,
          keyword: true,
        },
        {
          user: "kai.exe",
          text: "#giveaway 🎉 @mina.codes @leo.writes",
          mentions: 2,
          keyword: true,
        },
        {
          user: "ava.design",
          text: "#giveaway ぎりぎり間に合った @hana.builds @noah.dev",
          mentions: 2,
          keyword: true,
          late: true,
        },
        { user: "yuki.md", text: "このダッシュボード良いですね", mentions: 0, keyword: false },
        {
          user: "theo.ships",
          text: "#giveaway @ava.design @yuki.md 一緒にどうぞ",
          mentions: 2,
          keyword: true,
        },
        { user: "lila.dev", text: "#giveaway @theo.ships", mentions: 1, keyword: true },
        {
          user: "ren.tech",
          text: "#giveaway @lila.dev @yuki.md みんな頑張って",
          mentions: 2,
          keyword: true,
        },
      ],
    },
    note: "リプライはサンプルですが、ロジックは本物です。実際のデプロイでは、選んだ投稿のリプライを読み込みます。",
  },
  fairness: {
    kicker: "04 / 公正である理由",
    title: "説⁠明⁠で⁠き⁠るラ⁠ン⁠ダ⁠ム⁠性⁠を⁠、自⁠分⁠のサ⁠ー⁠バ⁠ー⁠で⁠。",
    description:
      "抽選が意味を持つのは、応募した人が結果を信じられるときだけです。リプライ一覧から当選者が決まるまでに何が起きているかを、そのまま書いておきます。",
    items: [
      {
        index: "01",
        title: "当てずっぽうではなくシャッフル",
        body: "当選者はブラウザの暗号学的乱数 crypto.getRandomValues を用いた Fisher–Yates シャッフルで決まります。対象となるすべての応募が同じ確率で、1 回の抽選で同じアカウントが 2 度当選することはありません。",
      },
      {
        index: "02",
        title: "主催者のリプライは母集団に入らない",
        body: "主催アカウントのリプライは母集団を組む前にサーバー側で除外されます。スレッドで応募者に返信しても、自分の抽選に自分が入ることはありません。",
      },
      {
        index: "03",
        title: "API で確認できないこと",
        body: "Threads が公開しているのはリプライだけです。リポスト・フォロー・いいねの条件は当選者に対して手動で確認する必要があります — パネルはその点をごまかさずに明記します。",
      },
      {
        index: "04",
        title: "データはデプロイ先から出ない",
        body: "リプライは暗号化して保管された自分のトークンで取得し、絞り込みはブラウザ内で完結します。第三者の抽選サービスが応募者を見ることはありません。",
      },
    ],
    tokenNote:
      "リプライの読み込みには threads_read_replies 権限を持つアクセストークンが必要です — トークン生成ガイドで手順を確認できます。",
    tokenCta: "トークン生成ガイドを見る",
  },
  cta: {
    title: "次⁠の⁠抽⁠選⁠は⁠、自⁠分⁠のダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ド⁠で⁠。",
    description:
      "Threads Analytics をデプロイして Threads アカウントを接続すれば、抽選パネルはすでにサイドバーにあります — 追加インストールは不要です。",
    primary: "ダッシュボードをデプロイ",
    secondary: "GitHub で見る",
    note: "応募・条件・結果のすべてが、自分のデプロイ内にとどまります。",
  },
};

const analyticsGuideEn: AnalyticsGuideCopy = {
  metadata: {
    title: "31 Threads Analytics Charts: Post, Content & Audience Metrics",
    description:
      "All 31 Threads analytics charts in the dashboard: overview, performance, content, and audience metrics, plus per-post stats and the baselines behind every number.",
  },
  hero: {
    kicker: "FEATURE / ANALYTICS",
    lineOne: "Thirty-one Threads analyses.",
    lineTwo: "One question each.",
    description:
      "Every chart answers one publishing decision: when to post, what format, how long, what to write about, who is reading. Here is the full list.",
    primaryCta: "See the full list",
    secondaryCta: "Deploy the dashboard",
    note: "Medians, not averages · Sample-size confidence · Your own baseline",
    hint: "Every chart recomputes over whatever date range you pick — nothing is precomputed or capped.",
    summary: {
      label: "WHAT YOU GET",
      badge: "PER ACCOUNT",
      total: "31",
      totalLabel: "analyses across four tabs",
      rows: [
        { name: "Overview", count: "4" },
        { name: "Performance", count: "11" },
        { name: "Content", count: "13" },
        { name: "Audience", count: "3" },
      ],
    },
  },
  railLabel: "ON THIS PAGE",
  sections: [
    {
      index: "01",
      kicker: "01 / OVERVIEW",
      title: "The account at a glance.",
      description:
        "The landing tab answers “how am I doing right now?” before you go looking for a reason.",
      panelName: "threads-analytics · overview",
      badge: "4 SECTIONS",
      railMeta: "4 sections",
      items: [
        {
          name: "Stat Cards",
          body: "Views, likes, replies, reposts, quotes, shares, and engagement rate — each with its change against the previous period of the same length.",
        },
        {
          name: "Best Hours",
          body: "Your top two or three posting hours ranked by median views, with a confidence indicator driven by sample size.",
        },
        {
          name: "Views Trend",
          body: "Views by day, week, or month, drawn against your own median as the baseline.",
        },
        {
          name: "Top Posts",
          body: "Everything that beat your median view count, ranked by multiplier — 3.2× median, not just “popular”.",
        },
      ],
    },
    {
      index: "02",
      kicker: "02 / PERFORMANCE",
      title: "Best time to post on Threads: when to post, and what actually travels.",
      description:
        "Eleven charts on reach and engagement: the timing questions, the quality map, and whether the account is growing at all.",
      panelName: "threads-analytics · performance",
      badge: "11 CHARTS",
      railMeta: "11 charts",
      stats: {
        label: "TAB STATS",
        items: ["Total Views", "Avg Views / Day", "Eng. Rate", "Share Rate"],
      },
      items: [
        {
          name: "Overall Performance",
          body: "Daily views, post count, and average views per post on one timeline.",
        },
        {
          name: "Post Quality Map",
          body: "Every post plotted by reach against engagement rate, dot size by shares, split into four quadrants: breakout, conversation, broadcast, underperforming.",
        },
        {
          name: "Views to Actions Funnel",
          body: "What share of views converts into each action — likes, replies, reposts, quotes, shares.",
        },
        {
          name: "Best Time to Post",
          body: "Median views as an hour-by-hour heatmap, with sample count and confidence in the tooltip.",
        },
        {
          name: "Engagement Rate Trend",
          body: "Daily interactions ÷ views, with a 7-day smoothed line over the noise.",
        },
        {
          name: "Best Day of Week",
          body: "Median views, engagement rate, and post count compared weekday by weekday.",
        },
        {
          name: "Format × Length Matrix",
          body: "A 2-D heatmap of every format-and-length combination against your median reach.",
        },
        {
          name: "Engagement Type Breakdown",
          body: "How your interactions split across likes, replies, reposts, quotes, and shares.",
        },
        {
          name: "Engagement Breakdown",
          body: "The same split stacked over time, so a shift in what people do shows up.",
        },
        {
          name: "Reach Growth Trend",
          body: "Median and average views per post over time — the honest answer to “is this account growing?”",
        },
        {
          name: "Views Distribution",
          body: "How posts spread across view ranges, with the hit rate for each milestone: 1k, 5k, 10k.",
        },
      ],
    },
    {
      index: "03",
      kicker: "03 / CONTENT",
      title: "Content analysis: what to write, how long, how often.",
      description:
        "Thirteen charts on the content itself — format, length, keywords, cadence, and the posts that start conversations.",
      panelName: "threads-analytics · content",
      badge: "13 CHARTS",
      railMeta: "13 charts",
      stats: {
        label: "TAB STATS",
        items: [
          "Posting Consistency",
          "Share Rate",
          "Quote Ratio",
          "Total Posts",
          "Longest Streak",
          "Current Streak",
        ],
      },
      items: [
        {
          name: "Posting Activity",
          body: "A calendar heatmap of how much you published each day.",
        },
        {
          name: "Content Type Performance",
          body: "Median views, engagement, and share rate by media type — text, image, video, carousel, audio — with thin buckets faded out.",
        },
        {
          name: "Post Length Analysis",
          body: "Median views by character-count bucket, with average, P75, hit rate, and confidence behind the tooltip.",
        },
        {
          name: "Publishing Frequency vs Performance",
          body: "Whether posting more in a week lifts reach or just dilutes it.",
        },
        { name: "Shares Trend", body: "Daily share counts over the long run." },
        {
          name: "Top Keywords by Engagement",
          body: "The words that carry your highest engagement rate — hashtags excluded, three-post minimum.",
        },
        {
          name: "Optimal Posting Frequency",
          body: "Per-post reach and engagement compared across weekly posting volumes.",
        },
        {
          name: "Content Type by Time Slot",
          body: "The best hour for each format, by median views.",
        },
        {
          name: "Top by Engagement Rate",
          body: "Posts ranked by (likes + replies + reposts + quotes) ÷ views.",
        },
        {
          name: "Reply-Rate Leaders",
          body: "Replies ÷ views — the posts that actually started something.",
        },
        {
          name: "Share-Rate Leaders",
          body: "Shares ÷ views — the posts people kept rather than just liked.",
        },
        {
          name: "Posting Gap vs Performance",
          body: "Median views by days since your last post: does daily beat taking a break?",
        },
        {
          name: "Content Feature Comparison",
          body: "Posts with and without links, with and without questions — your own data answering whether links cost reach.",
        },
      ],
    },
    {
      index: "04",
      kicker: "04 / AUDIENCE",
      title: "Follower growth and engagement rate: who is on the other side.",
      description:
        "Follower history the API refuses to backfill, so the dashboard records it one day at a time from the moment you deploy.",
      panelName: "threads-analytics · audience",
      badge: "3 CHARTS",
      railMeta: "3 charts",
      stats: {
        label: "TAB STATS",
        items: ["Followers", "Net Growth", "Avg / Day", "Days Tracked"],
      },
      items: [
        {
          name: "Follower Growth",
          body: "Follower count over time, one point per synced day, with that day's change in the tooltip.",
        },
        {
          name: "Follower Demographics",
          body: "Country, city, age, and gender distributions, each marked with the baseline date and given as both head count and percentage points.",
        },
        {
          name: "Composition Trend",
          body: "Each group's share as a change in percentage points from the baseline — composition moves too slowly for absolute shares to show anything.",
        },
      ],
      note: "Threads only reports followers as of right now, so history can't be backfilled. Audience data is captured at most once per calendar day no matter how often posts sync, and demographics need at least 100 followers before the API returns them.",
    },
    {
      index: "05",
      kicker: "05 / POSTS",
      title: "And every post, one at a time.",
      description:
        "The aggregate view eventually points at a specific post. The posts page is where you go read it.",
      panelName: "threads-analytics · posts",
      badge: "4 TOOLS",
      railMeta: "4 tools",
      items: [
        { name: "Sort", body: "By date, views, or likes." },
        { name: "Search", body: "Full-text across everything you have published." },
        {
          name: "Media filter",
          body: "Narrow to a format — only the types actually present in the current period are offered.",
        },
        {
          name: "Post detail",
          body: "Views, engagement rate, multiple of your median, view percentile, and a per-action breakdown for the post you opened.",
        },
      ],
    },
  ],
  method: {
    index: "06",
    kicker: "06 / THE METHOD",
    title: "Why these numbers are worth trusting.",
    description:
      "Analytics is easy to make flattering. These four rules are what keep the dashboard honest instead.",
    railMeta: "4 rules",
    items: [
      {
        index: "01",
        title: "Medians, not averages",
        body: "One post that went unusually far would drag an average up and keep it there, making every later post look like a failure. Medians describe your typical post, which is the one you are about to write.",
      },
      {
        index: "02",
        title: "Sample size decides confidence",
        body: "Three posts at 8 PM is not a finding. Buckets with thin samples are faded, labelled low-confidence, or left out of the ranking — the dashboard says “not enough data yet” rather than inventing a best hour.",
      },
      {
        index: "03",
        title: "Your own baseline",
        body: "Every comparison is against your own history, never against a global benchmark from accounts with different sizes, topics, and audiences. 3.2× median means 3.2× of your median.",
      },
      {
        index: "04",
        title: "Like-for-like periods",
        body: "Every delta compares against the immediately preceding period of the same length, so a 30-day view is never quietly measured against a 7-day one.",
      },
    ],
  },
  cta: {
    title: "Point all of this at your own account.",
    description:
      "Deploy the dashboard, connect your Threads account, and the first sync fills in every chart on this page from your own history.",
    primary: "Deploy the dashboard",
    secondary: "View on GitHub",
    note: "Every chart recomputes on your server, from data that never leaves it.",
  },
};

const analyticsGuideZh: AnalyticsGuideCopy = {
  metadata: {
    title: "Threads 數據分析圖表：貼文成效、內容與受眾共 31 種分析",
    description:
      "Threads Analytics 儀表板的 31 張 Threads 數據分析圖表完整清單：總覽、成效、內容、受眾與單篇貼文指標，以及每個數字背後的中位數、樣本信心度與個人基準線。",
  },
  hero: {
    kicker: "功能 / 分析",
    // \u2060 word joiners pin the break points: line one only breaks around Threads,
    // line two only breaks between 各自回答 and 一個問題.
    lineOne: "三⁠十⁠一⁠種 Threads 數⁠據⁠分⁠析⁠，",
    lineTwo: "各⁠自⁠回⁠答一⁠個⁠問⁠題⁠。",
    description:
      "Dashboard 的每張圖表都在回答一個發文決策：何時發、什麼形式、寫多長、寫什麼、誰在看。以下是完整清單。",
    primaryCta: "看完整清單",
    secondaryCta: "部署 Dashboard",
    note: "用中位數不用平均 · 樣本信心度 · 對照你自己的基準線",
    hint: "每張圖表都會依你挑選的日期區間即時重算，沒有預先算好的數字，也沒有上限。",
    summary: {
      label: "你會拿到什麼",
      badge: "每個帳號",
      total: "31",
      totalLabel: "個分析，分屬四個分頁",
      rows: [
        { name: "總覽", count: "4" },
        { name: "成效", count: "11" },
        { name: "內容", count: "13" },
        { name: "受眾", count: "3" },
      ],
    },
  },
  railLabel: "本頁內容",
  sections: [
    {
      index: "01",
      kicker: "01 / 總覽",
      title: "一⁠眼⁠看⁠完帳⁠號⁠現⁠況⁠。",
      description: "在你開始找原因之前，登入後的第一個分頁先回答「我現在表現如何」。",
      panelName: "threads-analytics · overview",
      badge: "4 個區塊",
      railMeta: "4 個區塊",
      items: [
        {
          name: "數據卡",
          body: "觀看、讚、回覆、轉發、引用、分享與互動率，每張都附上相較前一個等長時段的增減。",
        },
        {
          name: "最佳發文時段",
          body: "以中位數觀看排序的前 2–3 個時段，並依樣本數標示可信度。",
        },
        {
          name: "觀看趨勢",
          body: "可切換日／週／月的觀看走勢，疊上你自己的中位數基準線。",
        },
        {
          name: "高曝光貼文",
          body: "所有超過你中位數的貼文，依倍率排序 — 是「3.2× 中位數」，不只是「表現不錯」。",
        },
      ],
    },
    {
      index: "02",
      kicker: "02 / 成效分析",
      title: "最⁠佳⁠發⁠文⁠時⁠間與⁠觸⁠及⁠率⁠：什⁠麼⁠時⁠候⁠發⁠，什⁠麼⁠真⁠的傳⁠得⁠出⁠去⁠。",
      description: "十一張關於觸及與互動的圖表：發文時機、單篇品質定位，以及帳號到底有沒有在成長。",
      panelName: "threads-analytics · performance",
      badge: "11 張圖表",
      railMeta: "11 張圖表",
      stats: {
        label: "分頁指標",
        items: ["總觀看", "日均觀看", "互動率", "分享率"],
      },
      items: [
        { name: "整體成效", body: "每日觀看數、發文量與單篇平均觀看整合在同一條時間軸。" },
        {
          name: "單篇品質地圖",
          body: "以觸及對互動率定位每篇貼文，點的大小代表分享數，分成高觸及高互動、低觸及高互動、高觸及低互動、低觸及低互動四個象限。",
        },
        {
          name: "觀看到行動漏斗",
          body: "總觀看中有多少比例轉換成讚、回覆、轉發、引用與分享。",
        },
        {
          name: "最佳發文時間",
          body: "各小時中位數觀看的熱力圖，Tooltip 同時給出樣本數與可信度等級。",
        },
        { name: "互動率趨勢", body: "每日互動 ÷ 觀看，並疊上 7 日平滑線濾掉雜訊。" },
        { name: "最佳星期", body: "依星期比較中位數觀看、互動率與發文數。" },
        {
          name: "格式 × 長度矩陣",
          body: "以 2D 熱力圖比較每一種內容格式與長度的組合，相對於你的中位數觸及。",
        },
        { name: "互動類型佔比", body: "你的互動在讚、回覆、轉發、引用、分享之間怎麼分配。" },
        { name: "互動拆解趨勢", body: "同樣的組成隨時間堆疊，讀者行為的轉變會直接顯示出來。" },
        {
          name: "觸及成長趨勢",
          body: "單篇中位數與平均觀看的長期走向 — 對「這個帳號有在成長嗎」給出誠實的答案。",
        },
        {
          name: "觀看數分布",
          body: "貼文落在各觀看區間的分布，以及 1k、5k、1 萬各里程碑的達成率。",
        },
      ],
    },
    {
      index: "03",
      kicker: "03 / 內容分析",
      title: "內⁠容⁠分⁠析⁠：寫⁠什⁠麼⁠、寫⁠多⁠長⁠、多⁠久⁠發⁠一⁠次⁠。",
      description:
        "十三張關於內容本身的圖表 — 格式、長度、關鍵字、發文節奏，以及最能引發對話的貼文。",
      panelName: "threads-analytics · content",
      badge: "13 張圖表",
      railMeta: "13 張圖表",
      stats: {
        label: "分頁指標",
        items: ["發文穩定度", "分享率", "引用比例", "總貼文數", "最長連續發文", "目前連續發文"],
      },
      items: [
        { name: "發文活動", body: "顯示每天發文數量的日曆熱力圖。" },
        {
          name: "內容類型成效",
          body: "依文字、圖片、影片、輪播、音訊比較中位數觀看、互動率與分享率，樣本不足的類型自動淡化。",
        },
        {
          name: "貼文長度分析",
          body: "依字數區間比較中位數觀看，Tooltip 附上平均值、P75、命中率與可信度。",
        },
        { name: "發文頻率與成效", body: "一週多發幾篇會拉高觸及，還是只是稀釋單篇品質。" },
        { name: "分享趨勢", body: "每日分享數的長期走勢。" },
        {
          name: "熱門關鍵字互動分析",
          body: "互動率最高的詞彙 — 不含 hashtag，至少要出現在三篇貼文。",
        },
        { name: "最佳發文頻率", body: "比較不同每週發文量下的單篇觸及與互動表現。" },
        { name: "內容類型 × 發文時段", body: "依中位數觀看，找出每一種格式各自的最佳時段。" },
        { name: "互動率最高", body: "依（讚 + 回覆 + 轉發 + 引用）÷ 觀看排名的貼文。" },
        { name: "回覆率最高", body: "回覆 ÷ 觀看 — 真正引發對話的那些貼文。" },
        { name: "分享率最高", body: "分享 ÷ 觀看 — 讀者願意收藏轉傳、而不只是按讚的貼文。" },
        {
          name: "發文間隔與成效",
          body: "依「距上一篇隔幾天」比較中位數觀看：天天發比休息幾天好嗎？",
        },
        {
          name: "內容特徵對照",
          body: "有無連結、有無問句的貼文成效對照 — 用你自己的資料回答「連結會不會傷觸及」。",
        },
      ],
    },
    {
      index: "04",
      kicker: "04 / 受眾分析",
      title: "粉⁠絲⁠分⁠析⁠：另⁠一⁠頭在⁠看⁠的⁠是⁠誰⁠。",
      description:
        "追蹤者歷史是 API 不給回補的資料，所以 Dashboard 從你部署那天起，一天一筆自己記下來。",
      panelName: "threads-analytics · audience",
      badge: "3 張圖表",
      railMeta: "3 張圖表",
      stats: {
        label: "分頁指標",
        items: ["追蹤人數", "淨成長", "平均每日", "已累積天數"],
      },
      items: [
        {
          name: "追蹤人數變化",
          body: "追蹤人數折線，每同步一天記錄一筆，Tooltip 顯示當天的增減。",
        },
        {
          name: "追蹤者組成",
          body: "國家、城市、年齡、性別各一張分布圖，標出基準日位置，並同時給人數與百分點變化。",
        },
        {
          name: "組成變化趨勢",
          body: "各分類佔比相對基準日的百分點變化 — 組成移動太慢，只看絕對佔比什麼都讀不出來。",
        },
      ],
      note: "Threads 只提供「當下」的追蹤者數字，歷史無法回補。受眾資料每個日曆日最多只抓一次，不論貼文同步多頻繁都不會多花 API 額度；追蹤者組成另需帳號追蹤人數達 100 以上，API 才會回傳。",
    },
    {
      index: "05",
      kicker: "05 / 貼文頁",
      title: "然⁠後⁠，一⁠篇⁠一⁠篇⁠讀⁠。",
      description: "彙總數據最後總會指向某一篇貼文，貼文頁就是你去讀它的地方。",
      panelName: "threads-analytics · posts",
      badge: "4 項工具",
      railMeta: "4 項工具",
      items: [
        { name: "排序", body: "依日期、觀看數或按讚數排序。" },
        { name: "搜尋", body: "全文搜尋你發過的所有內容。" },
        {
          name: "媒體類型篩選",
          body: "縮小到單一格式 — 選單只會列出當前時段內實際存在的類型。",
        },
        {
          name: "貼文詳情",
          body: "點開後顯示觀看數、互動率、相對中位數倍率、觀看百分位，以及各行動類型的互動拆解。",
        },
      ],
    },
  ],
  method: {
    index: "06",
    kicker: "06 / 方法論",
    title: "為⁠什⁠麼這⁠些⁠數⁠字值⁠得⁠相⁠信⁠。",
    description: "數據分析要做得好看很容易，以下四條規則是讓這個 Dashboard 保持誠實的原因。",
    railMeta: "4 條規則",
    items: [
      {
        index: "01",
        title: "用中位數，不用平均",
        body: "一篇意外爆開的貼文會把平均值永久拉高，讓之後每一篇看起來都像失敗。中位數描述的是你的典型貼文 — 也就是你正要寫的這一篇。",
      },
      {
        index: "02",
        title: "樣本數決定可信度",
        body: "晚上八點發過三篇不算結論。樣本不足的欄位會被淡化、標示為低可信度，或直接不列入排名 — Dashboard 會說「資料還不夠」，而不是硬編一個最佳時段給你。",
      },
      {
        index: "03",
        title: "對照你自己的基準線",
        body: "所有比較都是跟你自己的歷史比，不是跟規模、主題、受眾都不同的其他帳號比。「3.2× 中位數」指的是你自己的中位數。",
      },
      {
        index: "04",
        title: "等長期間對照",
        body: "每一個增減都對照緊鄰的、等長的前一個期間，不會出現 30 天的數字偷偷跟 7 天比的情況。",
      },
    ],
  },
  cta: {
    title: "把⁠這⁠一⁠整⁠套指⁠向你⁠自⁠己⁠的⁠帳⁠號⁠。",
    description:
      "部署 Dashboard、連接 Threads 帳號，第一次同步就會用你自己的歷史資料，把這頁上的每一張圖表填滿。",
    primary: "部署 Dashboard",
    secondary: "在 GitHub 上查看",
    note: "每張圖表都在你自己的伺服器上運算，資料不會離開。",
  },
};

const analyticsGuideJa: AnalyticsGuideCopy = {
  metadata: {
    title: "Threads データ分析チャート：投稿・コンテンツ・オーディエンスの 31 種",
    description:
      "Threads Analytics の Threads データ分析チャート 31 種の一覧。概要・パフォーマンス・コンテンツ・オーディエンスと投稿ごとの指標、中央値・サンプル信頼度・個人ベースラインの考え方。",
  },
  hero: {
    kicker: "機能 / 分析",
    // \u2060 word joiners pin the break points: line one only breaks after Threads,
    // line two only breaks between 問いは and ひとつずつ.
    lineOne: "Threads 分⁠析⁠は⁠ ⁠3⁠1⁠ ⁠種⁠類⁠、",
    lineTwo: "問⁠い⁠はひ⁠と⁠つ⁠ず⁠つ⁠。",
    description:
      "すべてのチャートは投稿の判断に答えます。いつ、どの形式で、どれくらい、何を書くか、誰が読んでいるか。以下がその全一覧です。",
    primaryCta: "完全な一覧を見る",
    secondaryCta: "ダッシュボードをデプロイ",
    note: "平均ではなく中央値 · サンプル信頼度 · 自分のベースライン",
    hint: "どのチャートも選んだ期間でその場で再計算されます。事前集計も上限もありません。",
    summary: {
      label: "得られるもの",
      badge: "アカウントごと",
      total: "31",
      totalLabel: "種類の分析（4 タブ）",
      rows: [
        { name: "概要", count: "4" },
        { name: "パフォーマンス", count: "11" },
        { name: "コンテンツ", count: "13" },
        { name: "オーディエンス", count: "3" },
      ],
    },
  },
  railLabel: "このページ",
  sections: [
    {
      index: "01",
      kicker: "01 / 概要",
      title: "ア⁠カ⁠ウ⁠ン⁠ト⁠をひ⁠と⁠目⁠で⁠。",
      description: "理由を探しに行く前に、最初のタブが「今どうなっているか」に答えます。",
      panelName: "threads-analytics · overview",
      badge: "4 セクション",
      railMeta: "4 セクション",
      items: [
        {
          name: "統計カード",
          body: "ビュー・いいね・リプライ・リポスト・引用・シェア・エンゲージメント率を、同じ長さの前期との増減付きで表示します。",
        },
        {
          name: "最適投稿時間",
          body: "中央値ビューでランク付けした上位 2〜3 の時間帯を、サンプル数に基づく信頼度とともに表示。",
        },
        {
          name: "ビューの推移",
          body: "日／週／月で切り替えられるビュー推移に、自分の中央値をベースラインとして重ねます。",
        },
        {
          name: "トップ投稿",
          body: "中央値を上回った投稿を倍率で並べます — 「人気」ではなく「中央値の 3.2 倍」として。",
        },
      ],
    },
    {
      index: "02",
      kicker: "02 / パフォーマンス",
      title: "お⁠す⁠す⁠め⁠の投⁠稿⁠時⁠間⁠：い⁠つ⁠出⁠す⁠か⁠、何⁠が⁠実⁠際⁠に届⁠く⁠か⁠。",
      description:
        "リーチとエンゲージメントに関する 11 チャート。タイミングの問い、投稿の品質マップ、そしてアカウントが伸びているのかどうか。",
      panelName: "threads-analytics · performance",
      badge: "11 チャート",
      railMeta: "11 チャート",
      stats: {
        label: "タブ指標",
        items: ["総ビュー", "1 日平均ビュー", "エンゲージメント率", "シェア率"],
      },
      items: [
        {
          name: "全体パフォーマンス",
          body: "日次ビュー、投稿数、投稿あたり平均ビューを 1 つのタイムラインに統合。",
        },
        {
          name: "投稿品質マップ",
          body: "リーチとエンゲージメント率で全投稿を散布図化。ドットサイズはシェア数で、ブレイクアウト・対話・ブロードキャスト・低パフォーマンスの 4 象限に分かれます。",
        },
        {
          name: "ビューからアクションへの漏斗",
          body: "総ビューのうち、いいね・リプライ・リポスト・引用・シェアに変換された割合。",
        },
        {
          name: "最適な投稿時間",
          body: "時間帯別の中央値ビューをヒートマップで表示。Tooltip にサンプル数と信頼度を添えます。",
        },
        {
          name: "エンゲージメント率の推移",
          body: "日次のインタラクション ÷ ビューに、7 日平滑線を重ねてノイズを抑えます。",
        },
        {
          name: "最適な曜日",
          body: "曜日ごとに中央値ビュー、エンゲージメント率、投稿数を比較。",
        },
        {
          name: "フォーマット × 長さマトリクス",
          body: "形式と長さのすべての組み合わせを、自分の中央値リーチと比べる 2 次元ヒートマップ。",
        },
        {
          name: "エンゲージメント種別の内訳",
          body: "いいね・リプライ・リポスト・引用・シェアへの分かれ方。",
        },
        {
          name: "エンゲージメント内訳の推移",
          body: "同じ内訳を時系列で積み上げ、読者の行動の変化がそのまま見えるようにします。",
        },
        {
          name: "リーチ成長トレンド",
          body: "投稿あたりの中央値・平均ビューの推移 — 「このアカウントは伸びているのか」への率直な答え。",
        },
        {
          name: "ビュー数の分布",
          body: "投稿がどのビュー帯に分布しているかと、1k・5k・1 万それぞれの到達率。",
        },
      ],
    },
    {
      index: "03",
      kicker: "03 / コンテンツ",
      title: "投⁠稿⁠分⁠析⁠：何⁠を⁠、ど⁠れ⁠く⁠ら⁠い⁠、ど⁠の⁠頻⁠度⁠で⁠。",
      description:
        "コンテンツそのものに関する 13 チャート — 形式、長さ、キーワード、投稿のリズム、そして会話を生んだ投稿。",
      panelName: "threads-analytics · content",
      badge: "13 チャート",
      railMeta: "13 チャート",
      stats: {
        label: "タブ指標",
        items: [
          "投稿の継続性",
          "シェア率",
          "引用比率",
          "総投稿数",
          "最長連続投稿",
          "現在の連続投稿",
        ],
      },
      items: [
        { name: "投稿アクティビティ", body: "日ごとの投稿数を示すカレンダーヒートマップ。" },
        {
          name: "コンテンツタイプ別成果",
          body: "テキスト・画像・動画・カルーセル・音声ごとに中央値ビュー、エンゲージメント率、シェア率を比較。サンプルが少ない区分は薄く表示されます。",
        },
        {
          name: "投稿の長さ分析",
          body: "文字数帯ごとの中央値ビュー。Tooltip に平均・P75・到達率・信頼度を添えます。",
        },
        {
          name: "投稿頻度と成果",
          body: "週に多く出すとリーチが伸びるのか、それとも 1 本あたりが薄まるだけなのか。",
        },
        { name: "シェアの推移", body: "日次シェア数の長期的な動き。" },
        {
          name: "エンゲージメント上位キーワード",
          body: "最もエンゲージメント率が高い語 — ハッシュタグを除き、3 投稿以上に現れたもののみ。",
        },
        {
          name: "最適な投稿頻度",
          body: "週あたりの投稿本数ごとに、1 本あたりのリーチとエンゲージメントを比較。",
        },
        {
          name: "コンテンツタイプ × 時間帯",
          body: "中央値ビューに基づく、形式ごとの最適な投稿時間。",
        },
        {
          name: "エンゲージメント率上位",
          body: "（いいね + リプライ + リポスト + 引用）÷ ビューで並べた投稿。",
        },
        {
          name: "リプライ率上位",
          body: "リプライ ÷ ビュー — 実際に会話を始めた投稿。",
        },
        {
          name: "シェア率上位",
          body: "シェア ÷ ビュー — いいねより先に、手元に残された投稿。",
        },
        {
          name: "投稿間隔と成果",
          body: "前の投稿から何日空いたかで中央値ビューを比較。毎日出すのと少し休むのはどちらが良いか。",
        },
        {
          name: "コンテンツ特徴の比較",
          body: "リンクの有無、問いかけの有無で成果を対比 — 「リンクはリーチを損なうのか」に自分のデータで答えます。",
        },
      ],
    },
    {
      index: "04",
      kicker: "04 / オーディエンス",
      title: "フ⁠ォ⁠ロ⁠ワ⁠ー⁠分⁠析⁠：そ⁠の⁠向⁠こ⁠う⁠にい⁠る⁠の⁠は誰⁠か⁠。",
      description:
        "フォロワーの履歴は API が遡って返してくれないため、デプロイした日から 1 日 1 件ずつダッシュボードが記録します。",
      panelName: "threads-analytics · audience",
      badge: "3 チャート",
      railMeta: "3 チャート",
      stats: {
        label: "タブ指標",
        items: ["フォロワー", "純増", "1 日平均", "記録日数"],
      },
      items: [
        {
          name: "フォロワー推移",
          body: "同期した日ごとに 1 点のフォロワー数。Tooltip にその日の増減を表示します。",
        },
        {
          name: "フォロワー構成",
          body: "国・都市・年齢・性別の分布を 1 枚ずつ。基準日の位置を示し、人数と％ポイントの両方で変化を出します。",
        },
        {
          name: "構成の変化",
          body: "各グループの比率を基準日からの％ポイント変化で表示 — 構成の動きは遅く、絶対比率では何も見えないためです。",
        },
      ],
      note: "Threads は「現時点」のフォロワー情報しか返さないため、履歴は遡れません。オーディエンスのデータは投稿の同期頻度にかかわらず 1 暦日につき最大 1 回だけ取得され、フォロワー構成は 100 フォロワー以上でないと API が返しません。",
    },
    {
      index: "05",
      kicker: "05 / 投稿",
      title: "そ⁠し⁠て⁠、1 本⁠ず⁠つ読⁠む⁠。",
      description: "集計はいつか特定の 1 投稿を指します。投稿ページは、それを読みに行く場所です。",
      panelName: "threads-analytics · posts",
      badge: "4 つの機能",
      railMeta: "4 つの機能",
      items: [
        { name: "並べ替え", body: "日付・ビュー・いいねで並べ替え。" },
        { name: "検索", body: "公開したすべての投稿を全文検索。" },
        {
          name: "メディア種別フィルタ",
          body: "形式で絞り込み — 選べるのは、その期間に実際に存在する種別だけです。",
        },
        {
          name: "投稿の詳細",
          body: "開いた投稿のビュー、エンゲージメント率、中央値に対する倍率、ビューのパーセンタイル、アクション別の内訳を表示。",
        },
      ],
    },
  ],
  method: {
    index: "06",
    kicker: "06 / 考え方",
    title: "こ⁠の⁠数⁠値⁠を信⁠頼⁠で⁠き⁠る理⁠由⁠。",
    description:
      "分析は見栄えよく作るのが簡単です。ダッシュボードを正直に保っているのは、次の 4 つのルールです。",
    railMeta: "4 つのルール",
    items: [
      {
        index: "01",
        title: "平均ではなく中央値",
        body: "たまたま大きく伸びた 1 本は平均を押し上げ続け、その後のすべてを失敗のように見せます。中央値が表すのは自分の典型的な投稿 — つまり、これから書く 1 本です。",
      },
      {
        index: "02",
        title: "サンプル数が信頼度を決める",
        body: "20 時の投稿が 3 本では結論になりません。サンプルの少ない区分は薄く表示され、低信頼と明示されるか、ランキングから外れます。最適な時間をでっち上げるのではなく「まだデータが足りない」と言います。",
      },
      {
        index: "03",
        title: "自分のベースライン",
        body: "比較対象は常に自分の履歴で、規模もテーマも読者も違う他アカウントの一般的な基準ではありません。「中央値の 3.2 倍」は、あなた自身の中央値の 3.2 倍です。",
      },
      {
        index: "04",
        title: "同じ長さの期間で比較",
        body: "増減はすべて直前の同じ長さの期間と比べます。30 日の数字が 7 日の数字と静かに比較されることはありません。",
      },
    ],
  },
  cta: {
    title: "こ⁠れ⁠ら⁠す⁠べ⁠て⁠を自⁠分⁠のア⁠カ⁠ウ⁠ン⁠ト⁠に向⁠け⁠る⁠。",
    description:
      "ダッシュボードをデプロイして Threads アカウントを接続すれば、最初の同期でこのページのすべてのチャートが自分の履歴で埋まります。",
    primary: "ダッシュボードをデプロイ",
    secondary: "GitHub で見る",
    note: "どのチャートも自分のサーバー上で計算され、データが外に出ることはありません。",
  },
};

export const dictionaries = {
  en: {
    metadata: {
      title: "Threads Analytics: Free, Open-Source Analytics Tool for Threads",
      description:
        "Free, open-source Threads analytics tool you host yourself. Find your best posting time, content format, post length, and keywords from your own post data.",
    },
    nav: {
      // Searchable local name shown as a tag beside the wordmark; empty hides it.
      brandTag: "",
      demo: "Live demo",
      // Trigger for the feature menu; `analytics` is the homepage section it
      // opens with, so the two read as a group instead of repeating "features".
      features: "Features",
      analytics: "Analytics",
      mcp: "MCP server",
      giveaway: "Giveaway",
      deploy: "Deploy",
      tokenGuide: "Token guide",
      github: "GitHub",
    },
    hero: {
      eyebrow: "OPEN SOURCE · SELF-HOSTED · BUILT FOR THREADS",
      lineOne: "Free Threads analytics that",
      lineTwo: "shows what makes a post work.",
      description:
        "Free, open-source Threads analytics. Your own post history shows the best time to post, which formats and lengths work, and how your followers grow.",
      primaryCta: "Try the live analysis",
      secondaryCta: "View on GitHub",
      note: "31 analyses · Multi-account · Automatic sync",
    },
    proof: [
      { value: "31", label: "Threads analytics charts" },
      { value: "3", label: "interface languages" },
      { value: "24/7", label: "post & follower tracking" },
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
      cta: "See all 31 analyses",
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
          body: "Deploy with PostgreSQL on Railway, Zeabur, Vercel, Docker, or your own server. Tokens are encrypted at rest.",
        },
      ],
    },
    product: {
      kicker: "04 / THE FULL PICTURE",
      title: "Thirty-one Threads analytics charts. One publishing system.",
      description:
        "Move from account health to post-level diagnosis without leaving the dashboard. Overview, performance, content, audience, and posts share one source of truth.",
      labels: ["Overview", "Performance", "Content", "Audience", "Posts"],
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
    mcpHome: {
      kicker: "05 / BUILT-IN MCP SERVER",
      title: "Ask your own data, in plain language.",
      description:
        "Every deployment ships a read-only MCP server. Connect Claude, Codex, or Cursor over OAuth — no API keys — and your agent reads posts, analytics, and follower history to answer with reports and next moves.",
      cta: "Explore the MCP server",
      note: "Read-only · OAuth 2.1 · Revoke anytime",
    },
    giveawayHome: {
      kicker: "06 / GIVEAWAY, BUILT IN",
      title: "Draw winners without leaving your dashboard.",
      description:
        "Pick the post, apply the rules you announced — keyword, tagged friends, deadline, one entry per account — and draw right inside your own dashboard. No signing into your Threads account on someone else's site, and no paying for a giveaway tool.",
      cta: "See how a draw works",
      note: "Stackable conditions · No third-party login · No extra fees",
    },
    deploy: {
      kicker: "07 / OWN THE STACK",
      title: "Self-host your Threads analytics dashboard in minutes.",
      description:
        "Use a one-click template or run the container yourself. The official website stays separate; the deployable image contains only the analytics product.",
      railway: {
        eyebrow: "ONE-CLICK",
        title: "Deploy on Railway",
        body: "App, PostgreSQL, and required environment variables in one guided flow.",
        templateTab: "One-click",
        agentTab: "For your agent",
        action: "Open Railway template",
        agentAction: "Deploy with your agent",
      },
      zeabur: {
        eyebrow: "ONE-CLICK",
        title: "Deploy on Zeabur",
        body: "Start the service and database together, then connect your Threads token.",
        templateTab: "One-click",
        agentTab: "For your agent",
        action: "Open Zeabur template",
        agentAction: "Deploy with Zeabur Agent",
      },
      vercel: {
        eyebrow: "AGENT DEPLOY",
        title: "Deploy on Vercel",
        body: "Your coding agent drives Vercel MCP end to end: project, Neon Postgres, sensitive variables, and a verified production deploy.",
        action: "Deploy with your agent",
      },
      docker: {
        eyebrow: "BRING YOUR OWN SERVER",
        title: "Docker / VPS",
        body: "Run the multi-architecture image anywhere with a PostgreSQL connection.",
        action: "View GitHub package",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    zeaburAgentDeploy: {
      metadata: {
        title: "Self-Host Threads Analytics on Zeabur: One Prompt with Zeabur Agent",
        description:
          "Self-host Threads Analytics on Zeabur: one prompt and Zeabur's AI agent sets up PostgreSQL, encryption keys, the app password, and a public URL. No manual setup.",
      },
      hero: {
        kicker: "DEPLOY / ZEABUR AGENT",
        lineOne: "One prompt.",
        lineTwo: "The agent does the rest.",
        description:
          "Zeabur Agent reads the template, provisions PostgreSQL, generates the encryption key, asks for your password, and hands back a live URL. You only paste a prompt.",
        copyCta: "Copy the agent prompt",
        copiedCta: "Prompt copied",
        openCta: "Open Zeabur Agent",
        note: "About 2 minutes · No YAML, no environment variables",
      },
      prompt: {
        label: "AGENT PROMPT",
        hint: "Send copies the prompt and opens zeabur.com — paste it into the agent box there.",
        text: `Help me deploy this Threads Analytics template (${zeaburTemplate}) and ask me for the password during deployment.`,
        copy: "Copy",
        copied: "Copied",
        send: "Copy the prompt and open Zeabur Agent",
      },
      steps: {
        kicker: "01 / THREE STEPS",
        title: "From prompt to dashboard in three steps.",
        description:
          "No YAML, no environment variables, no database setup. The agent handles configuration; you make one decision — your password.",
        items: [
          {
            index: "01",
            title: "Copy the prompt",
            body: "Use the button above — the prompt already includes the template link and tells the agent to ask for your password.",
          },
          {
            index: "02",
            title: "Paste it into Zeabur Agent",
            body: "Open zeabur.com, sign in, and paste the prompt into the “Ask Zeabur Agent to deploy…” box at the bottom of the page.",
          },
          {
            index: "03",
            title: "Pick a password, get your URL",
            body: "The agent generates credentials, deploys PostgreSQL and the dashboard, and replies with your live URL and login password.",
          },
        ],
      },
      demo: {
        kicker: "02 / WATCH IT RUN",
        title: "What the conversation actually looks like.",
        description:
          "A replay of a real Zeabur Agent deployment — the same messages, choices, and result you'll see in your own chat.",
        windowTitle: "ZEABUR AGENT",
        status: "REPLAY",
        working: "Working…",
        workedForA: "Worked for 38s",
        workedForB: "Worked for 42s",
        lineOne:
          "I'll look up this template first to see what it deploys and what settings it needs.",
        lineTwo: "You're logged in with one server available: Tokyo, Japan. I'll deploy there.",
        setupTitle: "Here's what the template sets up:",
        setupItems: [
          "PostgreSQL 16 with a persistent volume for your analytics data",
          "threads-analytics dashboard, exposed on a public domain",
        ],
        passwordQuestion:
          "One thing I need from you: what password do you want for signing into the dashboard?",
        chips: [
          "Generate a strong password for me",
          "I'll type my own password",
          "I'll set it myself in the dashboard later",
        ],
        progress: [
          "Generating credentials",
          "Creating the project on your server",
          "Deploying the template",
          "Verifying both services",
        ],
        doneTitle: "Your Threads Analytics dashboard is deployed.",
        urlLabel: "URL",
        passwordLabel: "Your login password",
        passwordNote:
          "Save it to your password manager — you can change it later in the APP_PASSWORD variable.",
        replay: "Replay deployment",
        disclaimer: "Simulated replay · your run will look the same",
      },
      cta: {
        title: "Ready to run it yourself?",
        description: "Copy the prompt, open Zeabur Agent, and your dashboard is minutes away.",
        primary: "Open Zeabur Agent",
        secondary: "Back to all deploy options",
        others: "OTHER PLATFORMS",
      },
    },
    railwayAgentDeploy: {
      metadata: {
        title: "Self-Host Threads Analytics on Railway with Your Coding Agent",
        description:
          "Self-host Threads Analytics on Railway: two prompts and your coding agent (Claude Code, Codex, or any) set up PostgreSQL, migrations, and a public URL.",
      },
      hero: {
        kicker: "DEPLOY / RAILWAY AGENT",
        lineOne: "Two prompts.",
        lineTwo: "Your own agent does the rest.",
        description:
          "The first prompt installs Railway's tools into your coding agent. The second hands it the template: PostgreSQL, migrations, your password, and a public URL.",
        copyCta: "Copy the install prompt",
        copiedCta: "Prompt copied",
        openCta: "View Railway for Agents",
        note: "About 5 minutes · Two prompts, no YAML",
        worksWith: "WORKS WITH",
        moreAgents: "+ more",
      },
      prompts: {
        installLabel: "STEP 1 · INSTALL PROMPT",
        installText: "install railway agent tools using railway.com",
        deployLabel: "STEP 2 · DEPLOY PROMPT",
        deployText: `Help me deploy this Threads Analytics template (${railwayTemplate}) and ask me for the password during deployment.`,
        copy: "Copy",
        copied: "Copied",
        hint: "Paste each prompt into your own coding agent — any agent with terminal access works.",
      },
      steps: {
        kicker: "01 / THREE STEPS",
        title: "From two prompts to a live dashboard.",
        description:
          "No YAML, no environment variables, no dashboard clicking. Your agent drives the Railway CLI; you make one decision — your password.",
        items: [
          {
            index: "01",
            title: "Install the Railway tools",
            body: "Send the install prompt to your agent. It sets up the Railway CLI, agent skill, and MCP server — one time, for every future deploy.",
          },
          {
            index: "02",
            title: "Send the deploy prompt",
            body: "The prompt already includes the template link and tells the agent to ask for your dashboard password during the deployment.",
          },
          {
            index: "03",
            title: "Pick a password, get your URL",
            body: "The agent deploys PostgreSQL and the dashboard, runs migrations, generates a public domain, and replies with your live URL.",
          },
        ],
      },
      demo: {
        kicker: "02 / WATCH IT RUN",
        title: "What the conversation actually looks like.",
        description:
          "A replay of a real deployment driven from Codex — the same flow works in Claude Code or any agent with the Railway tools installed.",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "Working…",
        workedForA: "Worked for 42s",
        workedForB: "Worked for 2m 34s",
        workedForC: "Worked for 2m 2s",
        workedForD: "Worked for 1m 5s",
        toolsTitle: "Railway agent tools are installed and healthy:",
        toolsItems: [
          "Railway CLI and agent skill, ready for deployments",
          "Railway MCP server configured for this agent",
        ],
        passwordQuestion:
          "Railway is waiting for the template's required APP_PASSWORD. What password would you like for signing into the dashboard?",
        chips: [
          "Help me set a strong password",
          "I'll type my own password",
          "I'll set it myself later",
        ],
        progress: [
          "Generating credentials",
          "Deploying Threads Analytics + PostgreSQL",
          "Running database migrations",
        ],
        deployDone:
          "Deployment completed — both services report SUCCESS. The template has no public domain yet, so the app currently runs only inside Railway's network.",
        domainPrompt: "help me generate the domain",
        doneTitle: "Your Threads Analytics dashboard is live.",
        urlLabel: "URL",
        passwordLabel: "Your login password",
        passwordNote:
          "Save it to your password manager — you can change it later in the APP_PASSWORD variable.",
        replay: "Replay deployment",
        disclaimer: "Simulated replay · your run will look the same",
      },
      cta: {
        title: "Ready to hand it to your agent?",
        description:
          "Copy the install prompt, open your coding agent, and your dashboard is two prompts away.",
        primary: "View Railway for Agents",
        secondary: "Back to all deploy options",
        others: "OTHER PLATFORMS",
      },
    },
    vercelAgentDeploy: {
      metadata: {
        title: "Self-Host Threads Analytics on Vercel via Vercel MCP",
        description:
          "Self-host Threads Analytics on Vercel: one prompt and your coding agent with Vercel MCP set up Neon Postgres, secrets, a daily cron, and a production URL.",
      },
      hero: {
        kicker: "DEPLOY / VERCEL AGENT",
        lineOne: "One prompt.",
        lineTwo: "Vercel MCP does the rest.",
        description:
          "One prompt is the whole runbook: your agent drives Vercel MCP, pauses only for Neon and sensitive variables, and verifies the production deploy.",
        copyCta: "Copy the agent prompt",
        copiedCta: "Prompt copied",
        openCta: "View Vercel MCP docs",
        note: "About 10 minutes · One prompt, guardrails included",
        worksWith: "WORKS WITH",
        moreAgents: "+ more",
      },
      prompt: {
        label: "AGENT PROMPT",
        text: vercelAgentPrompt,
        copy: "Copy",
        copied: "Copied",
        hint: "Paste it into any coding agent with Vercel MCP connected and browser control — it pauses and waits for you to sign in to Vercel.",
        more: "Show full prompt",
        less: "Collapse prompt",
      },
      steps: {
        kicker: "01 / THREE STEPS",
        title: "One prompt, one sign-in, one password.",
        description:
          "The prompt encodes the entire deployment spec — tool boundaries, Neon settings, secret handling, verification. Your agent follows it; you appear exactly twice.",
        items: [
          {
            index: "01",
            title: "Copy the prompt",
            body: "It pins every detail: the prebuilt OCI image, the daily cron schedule, Neon in the matching region, and which secret values may never be printed.",
          },
          {
            index: "02",
            title: "Sign in when the browser opens",
            body: "Vercel MCP handles the project and deployments. For Neon storage and Sensitive variables the agent opens the dashboard and waits for your sign-in.",
          },
          {
            index: "03",
            title: "Set a password, get your URL",
            body: "Once the database is connected, the agent asks for APP_PASSWORD, creates a fresh Production deployment, and verifies migrations and the login page.",
          },
        ],
      },
      demo: {
        kicker: "02 / WATCH IT RUN",
        title: "What the conversation actually looks like.",
        description:
          "A replay of a real run in Claude Code — Vercel MCP for every deployment step, the browser only for Neon and Sensitive variables, and a pause before any dashboard change.",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "Working…",
        workedForA: "Worked for 2m 27s",
        workedForB: "Worked for 4m 9s",
        workedForC: "Worked for 4m 15s",
        promptMore: "Show more",
        planLine:
          "I'll use Vercel MCP for every supported Vercel operation and the browser only for the dashboard-only steps. First I'll create the two deployment files, then bootstrap the project.",
        approvalTitle: "Tool permission request",
        approvalTool: "vercel-mcp · deploy_to_vercel",
        approvalDesc:
          "Bootstrap project threads-analytics with Dockerfile.vercel and the daily cron — Preview, no secrets.",
        approvalAllow: "Allow",
        approvalDeny: "Deny",
        toolBadge: "VERCEL MCP",
        toolLine: "Project threads-analytics created — Preview bootstrap, region iad1",
        pauseLine:
          "Neon and Sensitive variables aren't exposed by Vercel MCP, so I've opened the Vercel dashboard. Please sign in if needed, then reply that you're ready — I won't change anything before that.",
        signedIn: "signed in and ready",
        browserLabel: "BROWSER",
        browserUrl: "vercel.com/storage",
        browserTitle: "Browse Storage",
        browserProvider: "Neon · Serverless Postgres",
        browserSpecs: [
          { label: "Plan", value: "Free" },
          { label: "Region", value: "iad1 · Washington, D.C." },
          { label: "Environments", value: "Production · Preview" },
          { label: "Variable prefix", value: "DATABASE" },
        ],
        browserCta: "Continue",
        setupTitle: "Dashboard setup is complete:",
        setupItems: [
          "Neon connected — DATABASE_URL on Production and Preview, value never displayed",
          "TOKEN_ENCRYPTION_KEY and CRON_SECRET stored as Sensitive variables",
        ],
        passwordQuestion:
          "Please provide your chosen APP_PASSWORD. I'll store it as a Sensitive variable for Production and Preview without repeating or exposing it.",
        chips: [
          "Help me generate a strong password",
          "I'll type my own password",
          "I'll set it myself later",
        ],
        progress: [
          "Storing APP_PASSWORD as a Sensitive variable",
          "Verifying all four variables on Production and Preview",
          "Creating a fresh Production deployment via Vercel MCP",
          "Prisma migrations applied — deployment READY",
          "Login page returns HTTP 200 · no runtime errors",
        ],
        doneTitle: "Deployment completed and verified.",
        urlLabel: "Production URL",
        metaLabel: "Final state",
        metaItems: ["READY", "Hobby plan", "Region iad1", "Cron 0 0 * * *"],
        passwordLabel: "APP_PASSWORD",
        passwordValue: "Copied to your clipboard",
        passwordNote:
          "Save it to your password manager, then sign in, add your Threads token, and run the first sync.",
        replay: "Replay deployment",
        disclaimer: "Simulated replay · condensed from a real run",
      },
      cta: {
        title: "Ready to hand it to your agent?",
        description:
          "Copy the prompt, make sure Vercel MCP is connected, and your dashboard deploys itself.",
        primary: "View Vercel MCP docs",
        secondary: "Back to all deploy options",
        others: "OTHER PLATFORMS",
      },
    },
    tokenGuide: tokenGuideEn,
    mcpGuide: mcpGuideEn,
    giveawayGuide: giveawayGuideEn,
    analyticsGuide: analyticsGuideEn,
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
      // Column headings, each followed by that column's links. The grouping
      // mirrors the primary nav: what the product does, how to deploy it,
      // and what to read.
      product: "Product",
      liveDemo: "Live demo",
      analytics: "Analytics",
      mcp: "MCP server",
      giveaway: "Giveaway",
      deploy: "Deploy",
      deployment: "Deployment options",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      resources: "Resources",
      tokenGuide: "Threads access token guide",
      analyticsReference: "Analytics reference",
      source: "Source code",
      readme: "Documentation",
      license: "AGPL-3.0 license",
    },
  },
  "zh-TW": {
    metadata: {
      title: "Threads 數據分析工具 Threads Analytics：免費開源、可自架的儀表板",
      description:
        "Threads Analytics 是免費開源、可自架的 Threads 數據分析工具。找出最佳發文時間、內容形式、文字長度與關鍵字，追蹤粉絲成長，資料完全留在自己的伺服器。",
    },
    nav: {
      // Searchable local name shown as a tag beside the wordmark; empty hides it.
      brandTag: "Threads 數據分析工具",
      demo: "互動展示",
      features: "功能",
      analytics: "分析功能",
      mcp: "MCP 伺服器",
      giveaway: "抽獎",
      deploy: "部署",
      tokenGuide: "Token 生成教學",
      github: "GitHub",
    },
    hero: {
      eyebrow: "開源 · 自架 · 為 THREADS 打造",
      // \u2060 word joiners pin the break points: line one only breaks
      // around Threads, line two only between 什麼樣的 and 貼文.
      lineOne: "免⁠費⁠開⁠源⁠的 Threads 數⁠據⁠分⁠析⁠工⁠具⁠，",
      lineTwo: "看⁠懂⁠什⁠麼⁠樣⁠的貼⁠文⁠會⁠有⁠成⁠效⁠。",
      description:
        "免費開源的脆（Threads）數據分析工具：從你的貼文紀錄找出最佳發文時間、有效的形式與長度，還有粉絲成長的來源。",
      primaryCta: "操作分析 Demo",
      secondaryCta: "前往 GitHub",
      note: "31 種分析 · 多帳號 · 自動同步",
    },
    proof: [
      { value: "31", label: "種 Threads 數據分析" },
      { value: "3", label: "種介面語言" },
      { value: "24/7", label: "自動同步貼文與粉絲數據" },
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
      title: "換⁠一⁠個⁠問⁠題⁠，看⁠見不⁠同⁠模⁠式⁠。",
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
      title: "因⁠為⁠想⁠看⁠的⁠答⁠案⁠，原⁠本⁠不⁠存⁠在⁠。",
      description:
        "多數分析工具只停在總數。Threads Analytics 從更實際的問題開始：什麼類型的貼文適合我？我又該在什麼時間發佈？",
      quote: "用了幾個 Threads 分析工具後，總覺得少了自己想看的分析，所以乾脆自己做了一個。",
      imageAlt: "最初介紹 Threads Analytics 的 Threads 貼文",
      marker: "起點貼文 · 2026",
    },
    features: {
      kicker: "03 / 從數據到決策",
      title: "不⁠只⁠是堆⁠滿⁠總⁠數⁠的儀⁠表⁠板⁠。",
      description: "每一個視圖都用來回答發文決策，而不是再多報告一個數字。",
      cta: "看完整的 31 個分析",
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
          body: "使用 Railway、Zeabur、Vercel、Docker 或自己的伺服器搭配 PostgreSQL，Token 會加密保存。",
        },
      ],
    },
    product: {
      kicker: "04 / 看見完整全貌",
      title: "3⁠1 種 T⁠h⁠r⁠e⁠a⁠d⁠s 數⁠據⁠分⁠析⁠，一⁠套發⁠文⁠系⁠統⁠。",
      description:
        "從帳號健康度一路看到單篇診斷，不必離開儀表板。總覽、成效、內容、受眾與貼文共用同一份資料來源。",
      labels: ["總覽", "成效分析", "內容分析", "受眾分析", "貼文"],
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
    mcpHome: {
      kicker: "05 / 內建 MCP 伺服器",
      title: "用⁠一⁠句⁠話⁠，問⁠你⁠自⁠己⁠的數⁠據⁠。",
      description:
        "每個部署都內建唯讀 MCP 伺服器。用 OAuth 連接 Claude、Codex 或 Cursor，不需要 API Key，Agent 就能讀取貼文、分析與追蹤者紀錄，直接回覆報告與下一步建議。",
      cta: "查看 MCP 連接教學",
      note: "唯讀 · OAuth 2.1 · 隨時可撤銷",
    },
    giveawayHome: {
      kicker: "06 / 內建抽獎功能",
      title: "開⁠獎不⁠用⁠離⁠開你⁠的 D⁠a⁠s⁠h⁠b⁠o⁠a⁠r⁠d⁠。",
      description:
        "選好貼文，套用你公告過的規則 — 關鍵字、標記朋友、截止時間、同帳號只算一次 — 直接在自己的儀表板開獎。不用到別人的網站登入 Threads 帳號，也不用為了抽獎功能額外付費。",
      cta: "看抽獎怎麼運作",
      note: "條件可疊加 · 不用第三方登入 · 不用額外付費",
    },
    deploy: {
      kicker: "07 / 掌握自己的環境",
      title: "幾⁠分⁠鐘⁠，自⁠架⁠好你⁠的 T⁠h⁠r⁠e⁠a⁠d⁠s 分⁠析⁠儀⁠表⁠板⁠。",
      description:
        "使用一鍵模板，或自己執行 Container。官方網站完全獨立，可部署的 Image 只包含分析產品。",
      railway: {
        eyebrow: "一鍵部署",
        title: "部署到 Railway",
        body: "在同一個引導流程裡完成 App、PostgreSQL 與必要環境變數。",
        templateTab: "一鍵部署",
        agentTab: "交給 Agent",
        action: "開啟 Railway 模板",
        agentAction: "用你的 Agent 部署",
      },
      zeabur: {
        eyebrow: "一鍵部署",
        title: "部署到 Zeabur",
        body: "一起啟動服務和資料庫，接著連接你的 Threads Token。",
        templateTab: "一鍵部署",
        agentTab: "交給 Agent",
        action: "開啟 Zeabur 模板",
        agentAction: "用 Zeabur Agent 部署",
      },
      vercel: {
        eyebrow: "AGENT 部署",
        title: "部署到 Vercel",
        body: "讓你的 Coding Agent 全程操作 Vercel MCP：建立專案、Neon Postgres、機密環境變數，一路驗證到正式部署。",
        action: "用你的 Agent 部署",
      },
      docker: {
        eyebrow: "使用自己的伺服器",
        title: "Docker / VPS",
        body: "在任何地方執行多架構 Image，只需要準備 PostgreSQL 連線。",
        action: "查看 GitHub Package",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    zeaburAgentDeploy: {
      metadata: {
        title: "自架 Threads 分析工具到 Zeabur：用 Zeabur Agent 一句話完成部署",
        description:
          "在 Zeabur 自架 Threads Analytics：複製一段 Prompt，讓 Zeabur AI Agent 自動部署 PostgreSQL、加密金鑰、登入密碼與公開網址，全程不用手動設定。",
      },
      hero: {
        kicker: "部署 / ZEABUR AGENT",
        lineOne: "一段 Prompt，",
        // ⁠ (word joiner) 防止 text-wrap: balance 從「交給」中間斷行。
        lineTwo: "剩下的交⁠給 Agent。",
        description:
          "Zeabur Agent 會讀取模板、建立 PostgreSQL、產生加密金鑰、詢問密碼，最後回傳可登入的網址。你只要複製貼上。",
        copyCta: "複製 Agent Prompt",
        copiedCta: "已複製 Prompt",
        openCta: "開啟 Zeabur Agent",
        note: "大約 2 分鐘 · 不用 YAML、不用環境變數",
      },
      prompt: {
        label: "AGENT PROMPT",
        hint: "按送出會複製 Prompt 並開啟 zeabur.com，貼進頁面上的 Agent 輸入框即可。",
        text: `幫我部署這個 Threads Analytics 模板（${zeaburTemplate}），並在部署過程中詢問我要設定的密碼。`,
        copy: "複製",
        copied: "已複製",
        send: "複製 Prompt 並開啟 Zeabur Agent",
      },
      steps: {
        kicker: "01 / 三個步驟",
        title: "從 P⁠r⁠o⁠m⁠p⁠t 到⁠儀⁠表⁠板⁠，只⁠要⁠三⁠步⁠。",
        description:
          "沒有 YAML、沒有環境變數、不用自己建資料庫。設定交給 Agent，你只需要決定一件事：登入密碼。",
        items: [
          {
            index: "01",
            title: "複製 Prompt",
            body: "用上面的按鈕複製。Prompt 已包含模板連結，也會提醒 Agent 在部署時跟你確認密碼。",
          },
          {
            index: "02",
            title: "貼給 Zeabur Agent",
            body: "打開 zeabur.com 並登入，把 Prompt 貼進頁面下方的「Ask Zeabur Agent to deploy…」輸入框送出。",
          },
          {
            index: "03",
            title: "選好密碼，拿到網址",
            body: "Agent 會產生憑證、部署 PostgreSQL 和儀表板，最後回覆你的網址與登入密碼。",
          },
        ],
      },
      demo: {
        kicker: "02 / 實際看一次",
        title: "整⁠段⁠對⁠話⁠，長⁠這⁠個⁠樣⁠子⁠。",
        description:
          "重播一次真實的 Zeabur Agent 部署過程：你會看到的訊息、選項和結果，和自己操作時一模一樣。",
        windowTitle: "ZEABUR AGENT",
        status: "REPLAY",
        working: "執行中…",
        workedForA: "執行了 38 秒",
        workedForB: "執行了 42 秒",
        lineOne: "我先查看這個模板，確認它會部署什麼、需要哪些設定。",
        lineTwo: "你已登入，有一台可用的伺服器：東京（日本）。我會部署在這裡。",
        setupTitle: "這個模板會建立：",
        setupItems: [
          "PostgreSQL 16，附持久化磁碟保存你的分析資料",
          "threads-analytics 儀表板，公開網域可直接存取",
        ],
        passwordQuestion: "需要你決定一件事：你想用什麼密碼登入儀表板？",
        chips: ["幫我產生一組強密碼", "我自己輸入密碼", "之後再到儀表板設定"],
        progress: ["產生憑證", "在你的伺服器建立專案", "部署模板", "確認兩個服務都啟動"],
        doneTitle: "你的 Threads Analytics 儀表板部署完成。",
        urlLabel: "網址",
        passwordLabel: "你的登入密碼",
        passwordNote: "請馬上存進密碼管理工具——之後也可以在 APP_PASSWORD 變數修改。",
        replay: "重播部署過程",
        disclaimer: "模擬重播 · 實際流程相同",
      },
      cta: {
        title: "換⁠你部⁠署⁠一⁠次⁠了⁠。",
        description: "複製 Prompt、開啟 Zeabur Agent，幾分鐘後就有自己的儀表板。",
        primary: "開啟 Zeabur Agent",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    railwayAgentDeploy: {
      metadata: {
        title: "自架 Threads 分析工具到 Railway：用 Claude Code、Codex 等 Coding Agent 部署",
        description:
          "在 Railway 自架 Threads Analytics：兩段 Prompt，讓 Claude Code、Codex 等 Coding Agent 完成 PostgreSQL、資料庫遷移、登入密碼與公開網址。",
      },
      hero: {
        kicker: "部署 / RAILWAY AGENT",
        lineOne: "兩段 Prompt，",
        lineTwo: "剩下的交⁠給你的 Agent。",
        description:
          "第一段 Prompt 把 Railway 工具裝進你的 Coding Agent，第二段交出模板：建立 PostgreSQL、執行遷移、詢問密碼、產生公開網址。",
        copyCta: "複製安裝 Prompt",
        copiedCta: "已複製 Prompt",
        openCta: "查看 Railway for Agents",
        note: "大約 5 分鐘 · 兩段 Prompt，不用 YAML",
        worksWith: "支援的 AGENT",
        moreAgents: "還有更多",
      },
      prompts: {
        installLabel: "步驟 1 · 安裝 PROMPT",
        installText: "install railway agent tools using railway.com",
        deployLabel: "步驟 2 · 部署 PROMPT",
        deployText: `幫我部署這個 Threads Analytics 模板（${railwayTemplate}），並在部署過程中詢問我要設定的密碼。`,
        copy: "複製",
        copied: "已複製",
        hint: "把兩段 Prompt 依序貼進你自己的 Coding Agent——只要能執行終端機指令的 Agent 都可以。",
      },
      steps: {
        kicker: "01 / 三個步驟",
        title: "從⁠兩⁠段 P⁠r⁠o⁠m⁠p⁠t 到⁠上⁠線⁠的儀⁠表⁠板⁠。",
        description:
          "沒有 YAML、沒有環境變數、不用點部署後台。你的 Agent 會操作 Railway CLI，你只需要決定一件事：登入密碼。",
        items: [
          {
            index: "01",
            title: "安裝 Railway 工具",
            body: "把安裝 Prompt 傳給你的 Agent，它會設定好 Railway CLI、Agent Skill 和 MCP Server——只要裝一次，之後每次部署都能用。",
          },
          {
            index: "02",
            title: "送出部署 Prompt",
            body: "Prompt 已包含模板連結，也會提醒 Agent 在部署過程中跟你確認儀表板密碼。",
          },
          {
            index: "03",
            title: "選好密碼，拿到網址",
            body: "Agent 會部署 PostgreSQL 和儀表板、執行資料庫遷移、產生公開網域，最後回覆你的網址。",
          },
        ],
      },
      demo: {
        kicker: "02 / 實際看一次",
        title: "整⁠段⁠對⁠話⁠，長⁠這⁠個⁠樣⁠子⁠。",
        description:
          "重播一次用 Codex 完成的真實部署——裝好 Railway 工具後，在 Claude Code 或任何 Agent 裡流程都一樣。",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "執行中…",
        workedForA: "執行了 42 秒",
        workedForB: "執行了 2 分 34 秒",
        workedForC: "執行了 2 分 2 秒",
        workedForD: "執行了 1 分 5 秒",
        toolsTitle: "Railway Agent 工具已安裝完成：",
        toolsItems: [
          "Railway CLI 與 Agent Skill，隨時可以部署",
          "Railway MCP Server 已設定給這個 Agent",
        ],
        passwordQuestion: "Railway 需要模板必填的 APP_PASSWORD。你想用什麼密碼登入儀表板？",
        chips: ["幫我設定一組強密碼", "我自己輸入密碼", "之後再自己設定"],
        progress: ["產生憑證", "部署 Threads Analytics 與 PostgreSQL", "執行資料庫遷移"],
        deployDone:
          "部署完成——兩個服務都回報 SUCCESS。模板還沒有公開網域，目前只能在 Railway 內部網路存取。",
        domainPrompt: "幫我產生公開網域",
        doneTitle: "你的 Threads Analytics 儀表板上線了。",
        urlLabel: "網址",
        passwordLabel: "你的登入密碼",
        passwordNote: "請馬上存進密碼管理工具——之後也可以在 APP_PASSWORD 變數修改。",
        replay: "重播部署過程",
        disclaimer: "模擬重播 · 實際流程相同",
      },
      cta: {
        title: "換⁠你⁠的 A⁠g⁠e⁠n⁠t 上⁠場⁠了⁠。",
        description: "複製安裝 Prompt、打開你的 Coding Agent，兩段 Prompt 後就有自己的儀表板。",
        primary: "查看 Railway for Agents",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    vercelAgentDeploy: {
      metadata: {
        title: "自架 Threads 分析工具到 Vercel：用 Coding Agent 透過 Vercel MCP 部署",
        description:
          "在 Vercel 自架 Threads Analytics：一段 Prompt，讓接上 Vercel MCP 的 Coding Agent 完成 Neon Postgres、機密環境變數、每日 Cron 與正式網址。",
      },
      hero: {
        kicker: "部署 / VERCEL AGENT",
        lineOne: "一段 Prompt，",
        lineTwo: "剩下交⁠給 Vercel MCP。",
        description:
          "一段 Prompt 就是完整部署手冊：Agent 用 Vercel MCP 執行每個步驟，只在設定 Neon 與機密變數時等你登入，最後驗證正式部署。",
        copyCta: "複製 Agent Prompt",
        copiedCta: "已複製 Prompt",
        openCta: "查看 Vercel MCP 文件",
        note: "大約 10 分鐘 · 一段 Prompt，內建防護規則",
        worksWith: "支援的 AGENT",
        moreAgents: "還有更多",
      },
      prompt: {
        label: "AGENT PROMPT",
        text: vercelAgentPrompt,
        copy: "複製",
        copied: "已複製",
        hint: "貼進任何接上 Vercel MCP、可操作瀏覽器的 Coding Agent——需要登入 Vercel 時它會暫停等你。",
        more: "展開完整 Prompt",
        less: "收合 Prompt",
      },
      steps: {
        kicker: "01 / 三個步驟",
        title: "一⁠段 P⁠r⁠o⁠m⁠p⁠t⁠、一⁠次⁠登⁠入⁠、一⁠組⁠密⁠碼⁠。",
        description:
          "Prompt 已寫好整份部署規格——工具邊界、Neon 設定、機密處理與驗證流程。Agent 照著執行，你只需要出場兩次。",
        items: [
          {
            index: "01",
            title: "複製 Prompt",
            body: "所有細節都固定好了：預先建置的 OCI Image、每日 Cron、對齊部署區域的 Neon，以及絕不顯示機密值的規則。",
          },
          {
            index: "02",
            title: "瀏覽器開啟時登入",
            body: "專案與部署都由 Vercel MCP 處理。Neon 儲存體與 Sensitive 變數需要儀表板，Agent 會開啟瀏覽器並暫停等你登入。",
          },
          {
            index: "03",
            title: "設定密碼，拿到網址",
            body: "資料庫連接完成後，Agent 會詢問 APP_PASSWORD，建立全新的 Production 部署，並驗證 Migration 與登入頁。",
          },
        ],
      },
      demo: {
        kicker: "02 / 實際看一次",
        title: "整⁠段⁠對⁠話⁠，長⁠這⁠個⁠樣⁠子⁠。",
        description:
          "重播一次在 Claude Code 完成的真實部署——部署操作全部走 Vercel MCP，瀏覽器只用來設定 Neon 與 Sensitive 變數，改動儀表板前都會先暫停等你確認。",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "執行中…",
        workedForA: "執行了 2 分 27 秒",
        workedForB: "執行了 4 分 9 秒",
        workedForC: "執行了 4 分 15 秒",
        promptMore: "顯示較多",
        planLine:
          "我會用 Vercel MCP 執行所有支援的 Vercel 操作，瀏覽器只用在儀表板限定的步驟。先建立兩個部署檔案，再初始化專案。",
        approvalTitle: "工具權限請求",
        approvalTool: "vercel-mcp · deploy_to_vercel",
        approvalDesc:
          "以 Dockerfile.vercel 與每日 Cron 初始化 threads-analytics 專案——Preview，不含任何機密。",
        approvalAllow: "允許",
        approvalDeny: "拒絕",
        toolBadge: "VERCEL MCP",
        toolLine: "已建立專案 threads-analytics——Preview 初始化，區域 iad1",
        pauseLine:
          "Neon 與 Sensitive 變數不在 Vercel MCP 的能力範圍，所以我開啟了 Vercel 儀表板。需要的話請先登入，完成後回覆我——在那之前我不會做任何變更。",
        signedIn: "已登入，可以繼續",
        browserLabel: "瀏覽器",
        browserUrl: "vercel.com/storage",
        browserTitle: "Browse Storage",
        browserProvider: "Neon · Serverless Postgres",
        browserSpecs: [
          { label: "方案", value: "Free" },
          { label: "區域", value: "iad1 · 華盛頓特區" },
          { label: "環境", value: "Production · Preview" },
          { label: "變數前綴", value: "DATABASE" },
        ],
        browserCta: "Continue",
        setupTitle: "儀表板設定完成：",
        setupItems: [
          "Neon 已連接——DATABASE_URL 套用到 Production 與 Preview，全程不顯示值",
          "TOKEN_ENCRYPTION_KEY 與 CRON_SECRET 已存成 Sensitive 變數",
        ],
        passwordQuestion:
          "請提供你要的 APP_PASSWORD。我會把它存成 Production 與 Preview 的 Sensitive 變數，不會重複或顯示出來。",
        chips: ["幫我產生一組強密碼", "我自己輸入密碼", "之後再自己設定"],
        progress: [
          "把 APP_PASSWORD 存成 Sensitive 變數",
          "驗證 Production 與 Preview 的四個變數",
          "透過 Vercel MCP 建立全新的 Production 部署",
          "Prisma Migration 完成——部署狀態 READY",
          "登入頁回應 HTTP 200 · 沒有執行期錯誤",
        ],
        doneTitle: "部署完成並通過驗證。",
        urlLabel: "Production 網址",
        metaLabel: "最終狀態",
        metaItems: ["READY", "Hobby 方案", "區域 iad1", "Cron 0 0 * * *"],
        passwordLabel: "APP_PASSWORD",
        passwordValue: "已複製到你的剪貼簿",
        passwordNote: "請馬上存進密碼管理工具，接著登入、加入你的 Threads Token，執行第一次同步。",
        replay: "重播部署過程",
        disclaimer: "模擬重播 · 濃縮自真實部署",
      },
      cta: {
        title: "換⁠你⁠的 A⁠g⁠e⁠n⁠t 上⁠場⁠了⁠。",
        description: "複製 Prompt、確認 Vercel MCP 已連接，儀表板就會自己部署完成。",
        primary: "查看 Vercel MCP 文件",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    tokenGuide: tokenGuideZh,
    mcpGuide: mcpGuideZh,
    giveawayGuide: giveawayGuideZh,
    analyticsGuide: analyticsGuideZh,
    finalCta: {
      kicker: "讀懂自己的訊號",
      title: "下⁠一⁠篇更⁠好⁠的⁠貼⁠文⁠，其⁠實⁠已⁠經藏⁠在歷⁠史⁠紀⁠錄⁠裡⁠。",
      description: "自架 Threads Analytics，把舊貼文變成下一次發文的判斷依據。",
      primary: "部署分析儀表板",
      secondary: "在 GitHub 加星",
    },
    footer: {
      description: "Threads Analytics：免費開源的 Threads 數據分析工具。",
      product: "產品",
      liveDemo: "互動展示",
      analytics: "分析功能",
      mcp: "MCP 伺服器",
      giveaway: "抽獎",
      deploy: "部署",
      deployment: "部署方式",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      resources: "資源",
      tokenGuide: "Access Token 生成教學",
      analyticsReference: "分析指標說明",
      source: "原始碼",
      readme: "使用文件",
      license: "AGPL-3.0 授權",
    },
  },
  ja: {
    metadata: {
      title:
        "Threads 分析ツール：無料・オープンソースのセルフホスト型ダッシュボード | Threads Analytics",
      description:
        "Threads Analytics は無料・オープンソースのセルフホスト型 Threads 分析ツール。最適な投稿時間、コンテンツ形式、文章量、キーワード、フォロワー推移を自分のデータから分析。データは自分のサーバーに残ります。",
    },
    nav: {
      // Searchable local name shown as a tag beside the wordmark; empty hides it.
      brandTag: "Threads 分析ツール",
      demo: "ライブデモ",
      features: "機能",
      analytics: "分析機能",
      mcp: "MCP サーバー",
      giveaway: "抽選",
      deploy: "デプロイ",
      tokenGuide: "トークン生成ガイド",
      github: "GitHub",
    },
    hero: {
      eyebrow: "オープンソース · セルフホスト · THREADS 専用",
      // \u2060 word joiners pin the break points: line one only breaks
      // around Threads, line two only between 投稿を and 勘で.
      lineOne: "無⁠料⁠のThreads分⁠析⁠ツ⁠ー⁠ル⁠で⁠、",
      lineTwo: "伸⁠び⁠る⁠投⁠稿⁠を勘⁠で⁠決⁠め⁠な⁠い⁠。",
      description:
        "無料・オープンソースのスレッズ（Threads）分析ツール。自分の投稿履歴から、おすすめの投稿時間、効く形式と長さ、フォロワーの伸びを読み取れます。",
      primaryCta: "分析デモを試す",
      secondaryCta: "GitHubを見る",
      note: "31種類の分析 · 複数アカウント · 自動同期",
    },
    proof: [
      { value: "31", label: "種類のThreads投稿分析" },
      { value: "3", label: "対応言語" },
      { value: "24/7", label: "投稿・フォロワーの自動同期" },
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
      title: "問⁠い⁠を⁠変⁠え⁠る⁠と⁠、パ⁠タ⁠ー⁠ン⁠が動⁠く⁠。",
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
      title: "欲⁠し⁠い⁠答⁠え⁠が⁠、ま⁠だな⁠か⁠っ⁠た⁠か⁠ら⁠。",
      description:
        "多くの分析ツールは合計値で止まります。Threads Analyticsは、もっと実用的な問いから始まりました。自分にはどんな投稿が合い、いつ公開すべきなのか。",
      quote:
        "いくつかのThreads分析ツールを試しても、見たい分析が足りなかったので、自分で作りました。",
      imageAlt: "Threads Analyticsを最初に紹介したThreads投稿",
      marker: "最初の投稿 · 2026",
    },
    features: {
      kicker: "03 / データから判断へ",
      title: "合⁠計⁠値⁠を並⁠べ⁠る⁠だ⁠け⁠のダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ドで⁠は⁠あ⁠り⁠ま⁠せ⁠ん⁠。",
      description: "すべてのビューは、投稿についての判断に答えるために設計されています。",
      cta: "31 種類すべてを見る",
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
          body: "Railway、Zeabur、Vercel、Docker、または自分のサーバーへPostgreSQLと一緒にデプロイ。Tokenは暗号化されます。",
        },
      ],
    },
    product: {
      kicker: "04 / 全体像",
      title: "3⁠1⁠種⁠類⁠のT⁠h⁠r⁠e⁠a⁠d⁠s⁠分⁠析⁠を⁠、一⁠つ⁠の投⁠稿⁠シ⁠ス⁠テ⁠ム⁠に⁠。",
      description:
        "アカウント全体の状態から投稿単位の診断まで、ダッシュボード内で移動できます。概要、パフォーマンス、コンテンツ、オーディエンス、投稿は同じデータを共有します。",
      labels: ["概要", "パフォーマンス", "コンテンツ", "オーディエンス", "投稿"],
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
    mcpHome: {
      kicker: "05 / 内蔵 MCP サーバー",
      title: "自⁠分⁠の⁠デ⁠ー⁠タ⁠に⁠、そ⁠の⁠ま⁠ま質⁠問⁠。",
      description:
        "すべてのデプロイに読み取り専用の MCP サーバーを内蔵。Claude、Codex、Cursor を OAuth で接続すれば、API キーなしでエージェントが投稿・分析・フォロワー履歴を読み取り、レポートと次の一手を返します。",
      cta: "MCP ガイドを見る",
      note: "読み取り専用 · OAuth 2.1 · いつでも解除可能",
    },
    giveawayHome: {
      kicker: "06 / 抽選機能を標準搭載",
      title: "ダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ド⁠を離⁠れ⁠ず⁠に当⁠選⁠者⁠を決⁠め⁠る⁠。",
      description:
        "投稿を選び、告知したルール — キーワード、友達のタグ付け、締切、1 アカウント 1 口 — を適用して、自分のダッシュボードで抽選。他社サイトで Threads アカウントにログインする必要も、抽選機能のために課金する必要もありません。",
      cta: "抽選の仕組みを見る",
      note: "条件の重ねがけ · 第三者ログイン不要 · 追加課金なし",
    },
    deploy: {
      kicker: "07 / 自分のスタックで",
      title: "数⁠分⁠で⁠、自⁠分⁠のT⁠h⁠r⁠e⁠a⁠d⁠s⁠分⁠析ダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ド⁠をセ⁠ル⁠フ⁠ホ⁠ス⁠ト⁠。",
      description:
        "ワンクリックテンプレート、または自分でコンテナを実行できます。公式サイトは独立し、配布imageには分析プロダクトだけが含まれます。",
      railway: {
        eyebrow: "ワンクリック",
        title: "Railwayへデプロイ",
        body: "App、PostgreSQL、必要な環境変数を一つのガイドで設定します。",
        templateTab: "ワンクリック",
        agentTab: "エージェント",
        action: "Railwayテンプレートを開く",
        agentAction: "自分のエージェントでデプロイ",
      },
      zeabur: {
        eyebrow: "ワンクリック",
        title: "Zeaburへデプロイ",
        body: "サービスとデータベースを同時に起動し、Threads Tokenを接続します。",
        templateTab: "ワンクリック",
        agentTab: "エージェント",
        action: "Zeaburテンプレートを開く",
        agentAction: "Zeabur Agentでデプロイ",
      },
      vercel: {
        eyebrow: "エージェントデプロイ",
        title: "Vercelへデプロイ",
        body: "コーディングエージェントがVercel MCPを最後まで操作。プロジェクト、Neon Postgres、機密変数、検証済みの本番デプロイまで自動です。",
        action: "自分のエージェントでデプロイ",
      },
      docker: {
        eyebrow: "自分のサーバーで",
        title: "Docker / VPS",
        body: "PostgreSQL接続を用意すれば、マルチアーキテクチャimageをどこでも実行できます。",
        action: "GitHub Packageを見る",
        command: "docker pull ghcr.io/ridemountainpig/threads-analytics:latest",
      },
    },
    zeaburAgentDeploy: {
      metadata: {
        title: "Threads Analytics を Zeabur にセルフホスト：Zeabur Agent でプロンプト1つ",
        description:
          "Threads Analytics を Zeabur にセルフホスト。プロンプト1つで Zeabur AI エージェントが PostgreSQL、暗号化キー、パスワード、公開 URL まで自動設定。",
      },
      hero: {
        kicker: "デプロイ / ZEABUR AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは1つ。",
        lineTwo: "残りはエ⁠ー⁠ジ⁠ェ⁠ン⁠トが。",
        description:
          "Zeabur Agent がテンプレートを読み、PostgreSQL と暗号化キーを用意し、パスワードを確認して公開 URL を返します。あなたはコピーして貼るだけ。",
        copyCta: "エージェント用プロンプトをコピー",
        copiedCta: "コピーしました",
        openCta: "Zeabur Agentを開く",
        note: "所要時間は約2分 · YAMLも環境変数も不要",
      },
      prompt: {
        label: "AGENT PROMPT",
        hint: "送信を押すとプロンプトをコピーしてzeabur.comを開きます。ページのエージェント入力欄に貼り付けてください。",
        text: `このThreads Analyticsテンプレート（${zeaburTemplate}）をデプロイしてください。デプロイ中にパスワードを私に確認してください。`,
        copy: "コピー",
        copied: "コピー済み",
        send: "プロンプトをコピーしてZeabur Agentを開く",
      },
      steps: {
        kicker: "01 / 3ステップ",
        title: "プ⁠ロ⁠ン⁠プ⁠トからダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ドま⁠で、3ス⁠テ⁠ッ⁠プ。",
        description:
          "YAMLも環境変数もデータベース設定も不要。設定はエージェントに任せて、あなたが決めるのはパスワードだけです。",
        items: [
          {
            index: "01",
            title: "プロンプトをコピー",
            body: "上のボタンでコピーします。テンプレートのリンクと、パスワードを確認する指示があらかじめ含まれています。",
          },
          {
            index: "02",
            title: "Zeabur Agentに貼り付け",
            body: "zeabur.comを開いてサインインし、ページ下部の「Ask Zeabur Agent to deploy…」入力欄にプロンプトを貼り付けます。",
          },
          {
            index: "03",
            title: "パスワードを決めてURLを受け取る",
            body: "エージェントが認証情報を生成し、PostgreSQLとダッシュボードをデプロイして、URLとログインパスワードを返信します。",
          },
        ],
      },
      demo: {
        kicker: "02 / 実際の流れ",
        title: "会⁠話⁠は⁠、こ⁠ん⁠な⁠ふ⁠う⁠に進⁠み⁠ま⁠す⁠。",
        description:
          "実際のZeabur Agentデプロイのリプレイです。あなたのチャットでも同じメッセージ、同じ選択肢、同じ結果が表示されます。",
        windowTitle: "ZEABUR AGENT",
        status: "REPLAY",
        working: "実行中…",
        workedForA: "38秒で完了",
        workedForB: "42秒で完了",
        lineOne: "まずこのテンプレートを確認し、何をデプロイし、どの設定が必要かを調べます。",
        lineTwo:
          "ログイン済みで、利用可能なサーバーが1台あります：東京（日本）。ここにデプロイします。",
        setupTitle: "このテンプレートが構築するもの：",
        setupItems: [
          "分析データを保存する永続ボリューム付きPostgreSQL 16",
          "公開ドメインで使えるthreads-analyticsダッシュボード",
        ],
        passwordQuestion:
          "1つだけ確認させてください。ダッシュボードのログインパスワードはどうしますか？",
        chips: ["強力なパスワードを生成して", "自分で入力する", "後でダッシュボードから設定する"],
        progress: [
          "認証情報を生成",
          "サーバーにプロジェクトを作成",
          "テンプレートをデプロイ",
          "2つのサービスを確認",
        ],
        doneTitle: "Threads Analyticsダッシュボードのデプロイが完了しました。",
        urlLabel: "URL",
        passwordLabel: "ログインパスワード",
        passwordNote:
          "今すぐパスワードマネージャーに保存してください。後からAPP_PASSWORD変数で変更できます。",
        replay: "デプロイをもう一度再生",
        disclaimer: "シミュレーションによる再現 · 実際の流れと同じです",
      },
      cta: {
        title: "次⁠は⁠、あ⁠な⁠た⁠の⁠番⁠で⁠す⁠。",
        description:
          "プロンプトをコピーしてZeabur Agentを開けば、数分でダッシュボードが手に入ります。",
        primary: "Zeabur Agentを開く",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    railwayAgentDeploy: {
      metadata: {
        title: "Threads Analytics を Railway にセルフホスト：コーディングエージェントでデプロイ",
        description:
          "Threads Analytics を Railway にセルフホスト。2つのプロンプトで Claude Code や Codex などのエージェントが PostgreSQL、マイグレーション、公開 URL まで自動設定。",
      },
      hero: {
        kicker: "デプロイ / RAILWAY AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは2つ。",
        lineTwo: "残りは自分のエ⁠ー⁠ジ⁠ェ⁠ン⁠トが。",
        description:
          "最初のプロンプトで Railway のツールをエージェントに導入。次のプロンプトでテンプレートを渡せば、PostgreSQL、マイグレーション、パスワード、公開 URL まで自動です。",
        copyCta: "インストール用プロンプトをコピー",
        copiedCta: "コピーしました",
        openCta: "Railway for Agentsを見る",
        note: "所要時間は約5分 · プロンプト2つ、YAML不要",
        worksWith: "対応エージェント",
        moreAgents: "ほか多数",
      },
      prompts: {
        installLabel: "STEP 1 · インストール用プロンプト",
        installText: "install railway agent tools using railway.com",
        deployLabel: "STEP 2 · デプロイ用プロンプト",
        deployText: `このThreads Analyticsテンプレート（${railwayTemplate}）をデプロイしてください。デプロイ中にパスワードを私に確認してください。`,
        copy: "コピー",
        copied: "コピー済み",
        hint: "2つのプロンプトを順番に自分のコーディングエージェントへ貼り付けてください。ターミナルを実行できるエージェントなら何でも使えます。",
      },
      steps: {
        kicker: "01 / 3ステップ",
        title: "2つのプ⁠ロ⁠ン⁠プ⁠トから、稼働中のダ⁠ッ⁠シ⁠ュ⁠ボ⁠ー⁠ドへ。",
        description:
          "YAMLも環境変数もダッシュボード操作も不要。エージェントがRailway CLIを操作し、あなたが決めるのはパスワードだけです。",
        items: [
          {
            index: "01",
            title: "Railwayツールをインストール",
            body: "インストール用プロンプトをエージェントに送ると、Railway CLI、エージェントスキル、MCPサーバーが設定されます。一度きりで、以降のデプロイでも使えます。",
          },
          {
            index: "02",
            title: "デプロイ用プロンプトを送信",
            body: "プロンプトにはテンプレートのリンクと、デプロイ中にパスワードを確認する指示があらかじめ含まれています。",
          },
          {
            index: "03",
            title: "パスワードを決めてURLを受け取る",
            body: "エージェントがPostgreSQLとダッシュボードをデプロイし、マイグレーションを実行して、公開ドメインを発行し、URLを返信します。",
          },
        ],
      },
      demo: {
        kicker: "02 / 実際の流れ",
        title: "会⁠話⁠は⁠、こ⁠ん⁠な⁠ふ⁠う⁠に進⁠み⁠ま⁠す⁠。",
        description:
          "Codexで実行した実際のデプロイのリプレイです。Railwayツールをインストールすれば、Claude Codeでもほかのエージェントでも同じ流れになります。",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "実行中…",
        workedForA: "42秒で完了",
        workedForB: "2分34秒で完了",
        workedForC: "2分2秒で完了",
        workedForD: "1分5秒で完了",
        toolsTitle: "Railwayエージェントツールの準備ができました：",
        toolsItems: [
          "Railway CLIとエージェントスキル、デプロイ可能",
          "このエージェント用にRailway MCPサーバーを設定済み",
        ],
        passwordQuestion:
          "テンプレート必須のAPP_PASSWORDが必要です。ダッシュボードのログインパスワードはどうしますか？",
        chips: ["強力なパスワードを設定して", "自分で入力する", "後で自分で設定する"],
        progress: [
          "認証情報を生成",
          "Threads AnalyticsとPostgreSQLをデプロイ",
          "データベースマイグレーションを実行",
        ],
        deployDone:
          "デプロイ完了 — 両サービスともSUCCESSです。テンプレートに公開ドメインはまだないため、現在はRailwayの内部ネットワークのみで動作しています。",
        domainPrompt: "公開ドメインを発行して",
        doneTitle: "Threads Analyticsダッシュボードが公開されました。",
        urlLabel: "URL",
        passwordLabel: "ログインパスワード",
        passwordNote:
          "今すぐパスワードマネージャーに保存してください。後からAPP_PASSWORD変数で変更できます。",
        replay: "デプロイをもう一度再生",
        disclaimer: "シミュレーションによる再現 · 実際の流れと同じです",
      },
      cta: {
        title: "次⁠は⁠、あ⁠な⁠た⁠のエ⁠ー⁠ジ⁠ェ⁠ン⁠ト⁠の番⁠で⁠す⁠。",
        description:
          "インストール用プロンプトをコピーしてエージェントを開けば、プロンプト2つでダッシュボードが手に入ります。",
        primary: "Railway for Agentsを見る",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    vercelAgentDeploy: {
      metadata: {
        title: "Threads Analytics を Vercel にセルフホスト：Vercel MCP 経由でデプロイ",
        description:
          "Threads Analytics を Vercel にセルフホスト。1つのプロンプトで Vercel MCP を接続したエージェントが Neon Postgres、機密変数、Cron、本番 URL まで自動設定。",
      },
      hero: {
        kicker: "デプロイ / VERCEL AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは1つ。",
        lineTwo: "残りはVercel MCPが。",
        description:
          "プロンプト 1 つが手順書。エージェントが Vercel MCP で各ステップを実行し、Neon と機密変数の設定時だけサインインを待ち、本番デプロイを検証します。",
        copyCta: "エージェント用プロンプトをコピー",
        copiedCta: "コピーしました",
        openCta: "Vercel MCPのドキュメントを見る",
        note: "所要時間は約10分 · プロンプト1つ、ガードレール込み",
        worksWith: "対応エージェント",
        moreAgents: "ほか多数",
      },
      prompt: {
        label: "AGENT PROMPT",
        text: vercelAgentPrompt,
        copy: "コピー",
        copied: "コピー済み",
        hint: "Vercel MCPを接続し、ブラウザを操作できるコーディングエージェントに貼り付けてください。Vercelへのサインインが必要になると一時停止します。",
        more: "プロンプト全文を表示",
        less: "折りたたむ",
      },
      steps: {
        kicker: "01 / 3ステップ",
        title: "プ⁠ロ⁠ン⁠プ⁠ト1つ、サ⁠イ⁠ン⁠イ⁠ン1回、パ⁠ス⁠ワ⁠ー⁠ド1つ。",
        description:
          "プロンプトにはデプロイ仕様のすべてが含まれています。ツールの境界、Neonの設定、シークレットの扱い、検証手順。エージェントがそれに従い、あなたの出番は2回だけです。",
        items: [
          {
            index: "01",
            title: "プロンプトをコピー",
            body: "ビルド済みOCIイメージ、毎日のCron、デプロイリージョンに合わせたNeon、シークレットを表示しないルールまで、すべて固定済みです。",
          },
          {
            index: "02",
            title: "ブラウザが開いたらサインイン",
            body: "プロジェクトとデプロイはVercel MCPが担当。NeonストレージとSensitive変数はダッシュボードが必要なため、エージェントがブラウザを開いて待機します。",
          },
          {
            index: "03",
            title: "パスワードを決めてURLを受け取る",
            body: "データベース接続後、エージェントがAPP_PASSWORDを確認し、新しいProductionデプロイを作成して、マイグレーションとログインページを検証します。",
          },
        ],
      },
      demo: {
        kicker: "02 / 実際の流れ",
        title: "会⁠話⁠は⁠、こ⁠ん⁠な⁠ふ⁠う⁠に進⁠み⁠ま⁠す⁠。",
        description:
          "Claude Codeで実行した実際のデプロイのリプレイです。デプロイ操作はすべてVercel MCP、ブラウザはNeonと機密変数の設定のみに使い、ダッシュボードを変更する前には必ず一時停止します。",
        windowTitle: "YOUR CODING AGENT",
        status: "REPLAY",
        working: "実行中…",
        workedForA: "2分27秒で完了",
        workedForB: "4分9秒で完了",
        workedForC: "4分15秒で完了",
        promptMore: "もっと見る",
        planLine:
          "サポートされているVercel操作はすべてVercel MCPで行い、ブラウザはダッシュボード限定の手順のみに使います。まず2つのデプロイファイルを作成し、プロジェクトを初期化します。",
        approvalTitle: "ツール権限のリクエスト",
        approvalTool: "vercel-mcp · deploy_to_vercel",
        approvalDesc:
          "Dockerfile.vercelと毎日のCronでthreads-analyticsプロジェクトを初期化 — Preview、シークレットなし。",
        approvalAllow: "許可",
        approvalDeny: "拒否",
        toolBadge: "VERCEL MCP",
        toolLine: "プロジェクトthreads-analyticsを作成 — Preview初期化、リージョンiad1",
        pauseLine:
          "Neonと機密変数はVercel MCPでは操作できないため、Vercelダッシュボードを開きました。必要ならサインインして、準備ができたら返信してください。それまで何も変更しません。",
        signedIn: "サインインしました、続けてください",
        browserLabel: "ブラウザ",
        browserUrl: "vercel.com/storage",
        browserTitle: "Browse Storage",
        browserProvider: "Neon · Serverless Postgres",
        browserSpecs: [
          { label: "プラン", value: "Free" },
          { label: "リージョン", value: "iad1 · ワシントンD.C." },
          { label: "環境", value: "Production · Preview" },
          { label: "変数プレフィックス", value: "DATABASE" },
        ],
        browserCta: "Continue",
        setupTitle: "ダッシュボードの設定が完了しました：",
        setupItems: [
          "Neonを接続 — DATABASE_URLをProductionとPreviewに適用、値は表示しません",
          "TOKEN_ENCRYPTION_KEYとCRON_SECRETをSensitive変数として保存",
        ],
        passwordQuestion:
          "APP_PASSWORDを教えてください。ProductionとPreviewのSensitive変数として保存し、以後表示や再掲はしません。",
        chips: ["強力なパスワードを生成して", "自分で入力する", "後で自分で設定する"],
        progress: [
          "APP_PASSWORDをSensitive変数として保存",
          "ProductionとPreviewの4つの変数を検証",
          "Vercel MCPで新しいProductionデプロイを作成",
          "Prismaマイグレーション完了 — デプロイはREADY",
          "ログインページがHTTP 200 · ランタイムエラーなし",
        ],
        doneTitle: "デプロイが完了し、検証も通りました。",
        urlLabel: "Production URL",
        metaLabel: "最終ステータス",
        metaItems: ["READY", "Hobbyプラン", "リージョンiad1", "Cron 0 0 * * *"],
        passwordLabel: "APP_PASSWORD",
        passwordValue: "クリップボードにコピー済み",
        passwordNote:
          "今すぐパスワードマネージャーに保存し、サインインしてThreadsトークンを追加、最初の同期を実行してください。",
        replay: "デプロイをもう一度再生",
        disclaimer: "シミュレーションによる再現 · 実際の実行を凝縮",
      },
      cta: {
        title: "次⁠は⁠、あ⁠な⁠た⁠のエ⁠ー⁠ジ⁠ェ⁠ン⁠ト⁠の番⁠で⁠す⁠。",
        description:
          "プロンプトをコピーし、Vercel MCPの接続を確認すれば、ダッシュボードは自動ででき上がります。",
        primary: "Vercel MCPのドキュメントを見る",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    tokenGuide: tokenGuideJa,
    mcpGuide: mcpGuideJa,
    giveawayGuide: giveawayGuideJa,
    analyticsGuide: analyticsGuideJa,
    finalCta: {
      kicker: "自分のシグナルを読む",
      title: "次⁠の⁠良⁠い⁠投⁠稿⁠は⁠、す⁠で⁠に履⁠歴⁠の⁠中⁠にあ⁠り⁠ま⁠す⁠。",
      description: "Threads Analyticsをセルフホストし、過去の投稿を次の判断材料に変えましょう。",
      primary: "ダッシュボードをデプロイ",
      secondary: "GitHubでスター",
    },
    footer: {
      description: "Threadsで発信する人のためのオープンソース分析ツール。",
      product: "プロダクト",
      liveDemo: "ライブデモ",
      analytics: "分析機能",
      mcp: "MCP サーバー",
      giveaway: "抽選",
      deploy: "デプロイ",
      deployment: "デプロイ方法",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      resources: "リソース",
      tokenGuide: "アクセストークン生成ガイド",
      analyticsReference: "分析リファレンス",
      source: "ソースコード",
      readme: "ドキュメント",
      license: "AGPL-3.0 ライセンス",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
