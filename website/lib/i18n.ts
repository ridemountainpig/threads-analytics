import { vercelAgentPrompt } from "./agent-prompts";
import { railwayTemplate, zeaburTemplate } from "./links";

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

const tokenGuideEn: TokenGuideCopy = {
  metadata: {
    title: "Generate a Threads access token — an 18-step visual guide | Threads Analytics",
    description:
      "A screenshot-by-screenshot guide: create a Meta app, add the Threads API use case, invite a Threads Tester, and copy the long-lived access token Threads Analytics needs.",
  },
  hero: {
    kicker: "GUIDE / THREADS ACCESS TOKEN",
    lineOne: "Eighteen steps.",
    lineTwo: "One access token.",
    description:
      "Your dashboard is deployed — now it needs a key to your Threads data. Follow one screenshot per step through Meta for Developers and walk away with a long-lived Threads access token.",
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
      "Threads access tokens expire. If syncing fails or the token is close to expiry, repeat the same flow to generate a fresh one.",
    primary: "See deploy options",
    secondary: "View on GitHub",
  },
};

const tokenGuideZh: TokenGuideCopy = {
  metadata: {
    title: "如何產生 Threads Access Token — 18 步驟圖解教學 | Threads Analytics",
    description:
      "一步一張截圖的完整教學：建立 Meta App、加入 Threads API Use Case、邀請 Threads Tester，最後複製 Threads Analytics 需要的 Long-lived Access Token。",
  },
  hero: {
    kicker: "教學 / THREADS ACCESS TOKEN",
    lineOne: "跟著十八個步驟，",
    lineTwo: "拿到一把 Access Token。",
    description:
      "Dashboard 部署好了，還差一把打開 Threads 數據的鑰匙。跟著 Meta for Developers 的畫面一步一步走，最後帶走一組 Long-lived Threads Access Token。",
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
    title: "四個階段，十八個步驟。",
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
    title: "複製好了？把它帶回家。",
    description: "把 Token 貼到 Dashboard 的 **Settings → Add Threads account**，執行第一次同步。",
    expiry: "Threads Access Token 會過期。若同步失敗或接近到期，請依照同樣流程重新產生一組。",
    primary: "查看部署方式",
    secondary: "前往 GitHub",
  },
};

const tokenGuideJa: TokenGuideCopy = {
  metadata: {
    title: "Threads アクセストークンの生成 — 18ステップ図解ガイド | Threads Analytics",
    description:
      "スクリーンショット付きの完全ガイド：Meta App を作成し、Threads API の Use Case を追加、Threads Tester を招待して、Threads Analytics に必要な Long-lived アクセストークンをコピーするまで。",
  },
  hero: {
    kicker: "ガイド / THREADS ACCESS TOKEN",
    lineOne: "18ス⁠テ⁠ッ⁠プで、",
    lineTwo: "ア⁠ク⁠セ⁠ス⁠ト⁠ー⁠ク⁠ンを手に。",
    description:
      "ダッシュボードのデプロイは完了。あとは Threads データを開く鍵だけです。Meta for Developers の画面を1ステップずつ進めば、Long-lived な Threads アクセストークンが手に入ります。",
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
    title: "4つのフェーズ、18のステップ。",
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
    title: "コピーできたら、持ち帰りましょう。",
    description:
      "ダッシュボードの **Settings → Add Threads account** に貼り付けて、最初の同期を実行します。",
    expiry:
      "Threads アクセストークンには有効期限があります。同期に失敗する場合や期限が近い場合は、同じ手順で再生成してください。",
    primary: "デプロイ方法を見る",
    secondary: "GitHub で見る",
  },
};

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
      tokenGuide: "Token guide",
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
        title: "Deploy with Zeabur Agent — one prompt, zero setup | Threads Analytics",
        description:
          "Copy one prompt and let Zeabur's AI agent deploy Threads Analytics for you: PostgreSQL, encryption keys, app password, and a public URL — no manual configuration.",
      },
      hero: {
        kicker: "DEPLOY / ZEABUR AGENT",
        lineOne: "One prompt.",
        lineTwo: "The agent does the rest.",
        description:
          "Zeabur Agent reads the template, provisions PostgreSQL, generates the encryption key, asks for your dashboard password, and hands back a live URL. You only copy a prompt.",
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
        title: "Deploy with your coding agent on Railway | Threads Analytics",
        description:
          "Two prompts and your own coding agent — Claude Code, Codex, or any agent — deploys Threads Analytics on Railway: PostgreSQL, migrations, app password, and a public URL.",
      },
      hero: {
        kicker: "DEPLOY / RAILWAY AGENT",
        lineOne: "Two prompts.",
        lineTwo: "Your own agent does the rest.",
        description:
          "First prompt installs Railway's agent tools into the coding agent you already use — Claude Code, Codex, Cursor. Second prompt hands it the template: it provisions PostgreSQL, runs migrations, asks for your password, and generates a public URL.",
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
        title: "Deploy with your coding agent on Vercel | Threads Analytics",
        description:
          "One prompt and your coding agent — Claude Code, Codex, or any agent with Vercel MCP — deploys Threads Analytics on Vercel: Neon Postgres, sensitive variables, daily cron, and a verified production URL.",
      },
      hero: {
        kicker: "DEPLOY / VERCEL AGENT",
        lineOne: "One prompt.",
        lineTwo: "Vercel MCP does the rest.",
        description:
          "The prompt is the whole runbook: your agent drives Vercel MCP for every deployment step, opens the dashboard only for Neon and Sensitive variables, pauses for you to sign in, and verifies the production deploy before reporting back.",
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
      deployGuides: "Deploy guides",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      tokenGuide: "Threads access token guide",
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
      tokenGuide: "Token 生成教學",
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
        title: "用 Zeabur Agent 一句話完成部署 | Threads Analytics",
        description:
          "複製一段 Prompt，讓 Zeabur AI Agent 自動部署 Threads Analytics：PostgreSQL、加密金鑰、登入密碼與公開網址，全程不用手動設定。",
      },
      hero: {
        kicker: "部署 / ZEABUR AGENT",
        lineOne: "一段 Prompt，",
        // ⁠ (word joiner) 防止 text-wrap: balance 從「交給」中間斷行。
        lineTwo: "剩下的交⁠給 Agent。",
        description:
          "Zeabur Agent 會讀取模板、建立 PostgreSQL、產生加密金鑰、詢問你的儀表板密碼，最後回傳一個可以直接登入的網址。你要做的只有複製貼上。",
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
        title: "從 Prompt 到儀⁠表⁠板，只要三步。",
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
        title: "整段對話，長這個樣子。",
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
        title: "換你部署一次了。",
        description: "複製 Prompt、開啟 Zeabur Agent，幾分鐘後就有自己的儀表板。",
        primary: "開啟 Zeabur Agent",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    railwayAgentDeploy: {
      metadata: {
        title: "用你的 Coding Agent 部署到 Railway | Threads Analytics",
        description:
          "兩段 Prompt，讓你自己的 Coding Agent（Claude Code、Codex 等）在 Railway 部署 Threads Analytics：PostgreSQL、資料庫遷移、登入密碼與公開網址，一次完成。",
      },
      hero: {
        kicker: "部署 / RAILWAY AGENT",
        lineOne: "兩段 Prompt，",
        lineTwo: "剩下的交⁠給你的 Agent。",
        description:
          "第一段 Prompt 把 Railway 的 Agent 工具裝進你平常用的 Coding Agent——Claude Code、Codex、Cursor 都可以。第二段把模板交給它：自動建立 PostgreSQL、執行遷移、詢問你的密碼，最後產生公開網址。",
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
        title: "從兩段 Prompt 到上線的儀⁠表⁠板。",
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
        title: "整段對話，長這個樣子。",
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
        title: "換你的 Agent 上場了。",
        description: "複製安裝 Prompt、打開你的 Coding Agent，兩段 Prompt 後就有自己的儀表板。",
        primary: "查看 Railway for Agents",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    vercelAgentDeploy: {
      metadata: {
        title: "用你的 Coding Agent 部署到 Vercel | Threads Analytics",
        description:
          "一段 Prompt，讓你的 Coding Agent（Claude Code、Codex 或任何接上 Vercel MCP 的 Agent）在 Vercel 部署 Threads Analytics：Neon Postgres、機密環境變數、每日 Cron，以及驗證完成的正式網址。",
      },
      hero: {
        kicker: "部署 / VERCEL AGENT",
        lineOne: "一段 Prompt，",
        lineTwo: "剩下交⁠給 Vercel MCP。",
        description:
          "這段 Prompt 就是完整的部署手冊：Agent 用 Vercel MCP 執行所有部署操作，只在設定 Neon 與 Sensitive 變數時開啟儀表板並暫停等你登入，最後驗證完 Production 部署才回報結果。",
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
        title: "一段 Prompt、一次登入、一組密碼。",
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
        title: "整段對話，長這個樣子。",
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
        title: "換你的 Agent 上場了。",
        description: "複製 Prompt、確認 Vercel MCP 已連接，儀表板就會自己部署完成。",
        primary: "查看 Vercel MCP 文件",
        secondary: "回到所有部署方式",
        others: "其他部署平台",
      },
    },
    tokenGuide: tokenGuideZh,
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
      deployGuides: "部署指南",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      tokenGuide: "Threads Access Token 生成教學",
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
      tokenGuide: "トークン生成ガイド",
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
        title: "Zeabur Agentでプロンプト1つデプロイ | Threads Analytics",
        description:
          "プロンプトをコピーするだけで、Zeabur AIエージェントがThreads Analyticsをデプロイ。PostgreSQL、暗号化キー、パスワード、公開URLまで自動で設定します。",
      },
      hero: {
        kicker: "デプロイ / ZEABUR AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは1つ。",
        lineTwo: "残りはエ⁠ー⁠ジ⁠ェ⁠ン⁠トが。",
        description:
          "Zeabur Agentがテンプレートを読み取り、PostgreSQLを作成し、暗号化キーを生成し、ログインパスワードを確認して、最後に公開URLを返します。あなたはコピーして貼るだけです。",
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
        title: "会話は、こんなふうに進みます。",
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
        title: "次は、あなたの番です。",
        description:
          "プロンプトをコピーしてZeabur Agentを開けば、数分でダッシュボードが手に入ります。",
        primary: "Zeabur Agentを開く",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    railwayAgentDeploy: {
      metadata: {
        title: "自分のコーディングエージェントでRailwayへデプロイ | Threads Analytics",
        description:
          "2つのプロンプトで、Claude CodeやCodexなど自分のエージェントがThreads AnalyticsをRailwayへデプロイ。PostgreSQL、マイグレーション、パスワード、公開URLまで自動です。",
      },
      hero: {
        kicker: "デプロイ / RAILWAY AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは2つ。",
        lineTwo: "残りは自分のエ⁠ー⁠ジ⁠ェ⁠ン⁠トが。",
        description:
          "最初のプロンプトで、普段使っているコーディングエージェント（Claude Code、Codex、Cursorなど）にRailwayのエージェントツールをインストール。次のプロンプトでテンプレートを渡せば、PostgreSQLの作成、マイグレーション、パスワード確認、公開URLの発行まで自動で進みます。",
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
        title: "会話は、こんなふうに進みます。",
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
        title: "次は、あなたのエージェントの番です。",
        description:
          "インストール用プロンプトをコピーしてエージェントを開けば、プロンプト2つでダッシュボードが手に入ります。",
        primary: "Railway for Agentsを見る",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    vercelAgentDeploy: {
      metadata: {
        title: "自分のコーディングエージェントでVercelへデプロイ | Threads Analytics",
        description:
          "1つのプロンプトで、Claude CodeやCodexなどVercel MCPを接続したエージェントがThreads AnalyticsをVercelへデプロイ。Neon Postgres、機密変数、毎日のCron、検証済みの本番URLまで自動です。",
      },
      hero: {
        kicker: "デプロイ / VERCEL AGENT",
        lineOne: "プ⁠ロ⁠ン⁠プ⁠トは1つ。",
        lineTwo: "残りはVercel MCPが。",
        description:
          "このプロンプトはデプロイ手順書そのものです。エージェントはデプロイ操作をすべてVercel MCPで行い、Neonと機密変数の設定時だけダッシュボードを開いてサインインを待ち、本番デプロイを検証してから結果を報告します。",
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
        title: "会話は、こんなふうに進みます。",
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
        title: "次は、あなたのエージェントの番です。",
        description:
          "プロンプトをコピーし、Vercel MCPの接続を確認すれば、ダッシュボードは自動ででき上がります。",
        primary: "Vercel MCPのドキュメントを見る",
        secondary: "他のデプロイ方法へ戻る",
        others: "他のプラットフォーム",
      },
    },
    tokenGuide: tokenGuideJa,
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
      deployGuides: "デプロイガイド",
      railwayAgent: "Railway Agent",
      zeaburAgent: "Zeabur Agent",
      vercelAgent: "Vercel Agent",
      tokenGuide: "アクセストークン生成ガイド",
      source: "ソースコード",
      readme: "ドキュメント",
    },
  },
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
