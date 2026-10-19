# 貼文復盤學習迴圈 × Skills 系統：分析與實作規劃

> 狀態：規劃草案（尚未實作）。本文件依目前 `main`（0.1.1）的程式碼撰寫，檔名與函式名稱都對應現有程式。

## 0. 結論摘要

| 項目                      | 建議                                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 復盤由誰做                | **伺服器負責「偵測 + 準備證據」，agent 負責「判讀 + 寫結論」**。伺服器本身不跑 LLM，所以每次 sync 後用既有的成長曲線（`PostMetricSnapshot`）找出低於預期的貼文、排進待復盤佇列；agent 下次連線（或被排程叫起）時讀取證據、寫回原因。                                    |
| 怎麼知道哪篇是 agent 寫的 | agent 生成貼文時呼叫新的 `save_post_draft` 存草稿，sync 抓到新貼文後用**字元 bigram 相似度**（中文不需斷詞）自動配對草稿 ↔ 已發佈貼文。使用者不必改變發文方式。                                                                                                         |
| 經驗如何回饋              | 兩層儲存：單篇的 `PostRetrospective`（原始復盤）＋精煉過的 `ContentLearning`（經驗法則，可去重、有信心度與驗證次數）。生成新貼文前 agent 呼叫 `get_content_guidance` 取回精簡清單，套用後記錄在草稿上，該貼文的成績再自動回頭驗證那條經驗。                             |
| 權限                      | MCP 目前是純唯讀（`analytics:read`）。新增 `memory:write` scope，只能寫草稿／復盤／經驗，**永遠不會寫到 Threads**。舊連線維持唯讀，重新授權後才能寫入。                                                                                                                 |
| Skills 安裝方式           | **不要在伺服器上真的執行 `npx skills add`**（需要 `git`、需要可寫且持久的檔案系統，Docker / Vercel / desktop 三個目標都不保證有）。改做「**相容 `npx skills add` 語法與 `skills-lock.json` 格式**」的內建安裝器：直接從 GitHub 讀檔、存進資料庫，三個部署目標行為一致。 |
| Skills 怎麼給 agent 用    | 以 MCP **tools** 為主（`list_skills` → `get_skill` → `get_skill_file`，對應 Agent Skills 的漸進式載入），再加一個 `use-skill` prompt 與 resources 給支援的 client。安裝只能在 Dashboard 由使用者操作，agent 只能讀取「已啟用」的 skill。                                |
| 推薦 skills               | 見 [3.9](#39-推薦-skills-清單)。另外建議本 repo 自己發佈 `threads-post-writer`、`threads-post-retrospective` 兩個第一方 skill（含繁中），補上市面上缺少的 Threads 專屬與繁中寫作 skill。                                                                                |

---

## 1. 現況盤點

與這兩個功能有關、會直接影響設計的事實：

1. **MCP 完全唯讀**：`lib/oauth.ts` 只有 `MCP_SCOPE = "analytics:read"`；`app/oauth/authorize/validate.ts` 拒絕其他 scope，且固定回傳 `MCP_SCOPE`；同意頁文案寫明「它無法修改任何資料，也無法代替你發文」（`lib/i18n.ts` 的 `scopeNoWrite`）；README 寫 "Everything is **read-only**"。`monthly-review` prompt 甚至特意把實驗紀錄留在 client 端（`threads-reviews/YYYY-MM.md`）。→ 這兩個功能都需要「伺服器端持久的 agent 記憶」，是一個刻意的設計轉向，需要新 scope 與清楚的同意文案。
2. **伺服器不跑 LLM**：agent 是外部 MCP client（Claude Code、Claude Desktop/Web 等）。伺服器無法自己「回頭分析」，只能準備資料、等 agent 來讀。
3. **已經有判斷「表現不如預期」所需的資料**：
   - `PostMetricSnapshot` 記錄每篇貼文前 30 天的成長（`lib/post-metric-snapshots.ts`）。
   - `lib/post-growth.ts` 的 `compareGrowth()` / `readingAtAge()` / `medianAtAge()` 可以算「同年齡時 vs 中位數」的倍數 `vsMedian`。
   - `lib/post-growth-data.ts` 的 `getRecentPostPace()` 已經是 Today 頁「比平常快/慢」的邏輯（`TYPICAL_SAMPLE_SIZE = 60`）。
   - `lib/analytics.ts` 有時段、長度、格式、關鍵字、文字特徵（問句、連結）、發文間隔等分析函式；`lib/database/post-benchmarks-*` 有各類型中位數與百分位。
4. **沒有任何「草稿／agent 產出」的紀錄**：貼文全部來自 Threads API sync，無法分辨哪篇是 agent 寫的。
5. **兩套資料庫**：Postgres（`prisma/schema.prisma`）與 desktop SQLite（`desktop/runtime/prisma/schema.prisma`），`desktop/tests/schema-parity.test.mjs` 強制兩邊 model 一致，migration 也要兩邊各寫一份。
6. **部署目標**：Docker（`node:24-alpine`，無 `git`、容器可能隨時重建）、Vercel（serverless、只有 `/tmp` 可寫、無 `git`）、Railway/Zeabur、desktop（`.app` 內嵌 Node 執行檔但沒有 npm/npx，`git` 只有在使用者裝過 Xcode CLT 時才有）。
7. **MCP SDK 能力**：`mcp-handler` 2.3 會把 OAuth 的 `authInfo`（含 `scopes`）傳進 tool handler 的 context（`ctx.http?.authInfo`），也支援 `registerResource` 與非同步的 server 初始化函式，所以可以依 scope 決定是否允許寫入，也可以依資料庫內容動態註冊 prompt。
8. Repo 本身已在用 `npx skills add`：`skills-lock.json` 與 `.agents/skills/native-sdk`。

---

## 2. 功能一：貼文復盤與經驗累積

### 2.1 需求拆解

「agent 生成貼文 → 發佈後流量不如預期 → agent 回頭分析並記錄原因 → 之後生成時參考」可以拆成四個要解決的問題：

| #   | 問題                         | 解法                                                                   |
| --- | ---------------------------- | ---------------------------------------------------------------------- |
| A   | 怎麼把草稿和發佈的貼文連起來 | agent 存草稿 → sync 後自動比對文字 → 低信心時讓使用者／agent 確認      |
| B   | 「不如預期」的定義           | 伺服器用成長曲線做確定性判定（同年齡 vs 中位數，或草稿自己設定的目標） |
| C   | 誰、什麼時候做分析           | 伺服器排佇列 + 準備證據包；agent 在下次對話開頭、或排程任務中處理      |
| D   | 經驗怎麼回饋到生成           | 精煉成「經驗法則」清單，生成前一次取回；套用後由新貼文的成績自動驗證   |

另外建議**表現特別好的貼文也一起復盤**（預設開啟、可關）：只從失敗學習會有偏誤，成功案例才知道「該多做什麼」。

### 2.2 整體流程

```text
          ┌──────────── agent（Claude 等 MCP client）────────────┐
          │ 1. get_content_guidance  ← 經驗法則 + 已啟用 skills    │
          │ 2. 撰寫貼文（套用 skills / 經驗）                     │
          │ 3. save_post_draft(text, 假設, 套用的經驗/skills)      │
          └──────────────┬──────────────────────────────────────┘
                         │ 使用者照常在 Threads 發文
                         ▼
   sync（排程 / 手動 / Vercel cron） ── lib/sync-service.ts syncAccount()
     ├─ 4. 新貼文 ↔ 草稿 自動配對（lib/draft-matching.ts）
     └─ 5. 貼文滿 24h / 7d → 判定表現（lib/retrospective.ts）
             ├─ 正常 → 若有套用經驗，記一次「支持」
             └─ 低於／高於預期 → 建立 PostRetrospective(status = pending)
                         │
                         ▼
          ┌──────────── agent 下次被叫起 ───────────────────────┐
          │ 6. get_account_overview 看到 pendingRetrospectives  │
          │ 7. get_post_diagnostics ← 伺服器算好的證據包         │
          │ 8. record_post_retrospective(原因, 信心, 證據)       │
          │ 9. save_content_learning(新增 / 合併 / 調整經驗)     │
          └─────────────────────────────────────────────────────┘
                         │
                         └──→ 回到步驟 1，下一篇貼文就會參考
```

### 2.3 資料模型（Postgres 與 SQLite 各一份）

```prisma
// agent 產出的貼文草稿。發佈後由 sync 比對連到 Post，讓復盤知道當初的意圖。
model PostDraft {
  id                 String          @id @default(cuid())
  accountId          String
  account            ThreadsAccount  @relation(fields: [accountId], references: [id], onDelete: Cascade)
  // 第一段是主貼文，其餘是串文的 2/、3/…
  parts              Json
  goal               String?         // views | engagement | replies | shares | followers
  // [{ statement, metric, expectation }]，例如「問句開頭會提高回覆率」
  hypotheses         Json?
  appliedLearningIds Json?
  skillsUsed         Json?           // [{ name, computedHash }]
  plannedFor         DateTime?       @db.Timestamptz(3)
  status             String          @default("draft") // draft | published | discarded
  postId             String?         @unique
  post               Post?           @relation(fields: [postId], references: [id], onDelete: SetNull)
  matchScore         Float?          // 0–1，自動配對的相似度；手動連結為 null
  clientId           String?         // 哪個 OAuth client 寫的
  createdAt          DateTime        @default(now()) @db.Timestamptz(3)
  updatedAt          DateTime        @updatedAt @db.Timestamptz(3)

  @@index([accountId, status])
}

// 單篇貼文在某個時間點的判定與 agent 寫回的分析。
model PostRetrospective {
  id          String    @id @default(cuid())
  accountId   String
  postId      String
  post        Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  trigger     String    // underperformed | overperformed | manual
  milestone   String    // 24h | 7d
  metric      String    // views（之後可擴充 engagement）
  value       Int
  baseline    Float?    // 同年齡中位數，或草稿目標
  vsBaseline  Float?
  status      String    @default("pending") // pending | analyzed | dismissed
  // 判定當下伺服器算出的證據快照（見 2.5），之後資料變動也能重現當時的判斷
  diagnostics Json?
  summary     String?
  // [{ category, statement, evidence, confidence }]
  causes      Json?
  // 草稿假設的驗證結果 [{ statement, verdict: supported | rejected | inconclusive }]
  hypothesisVerdicts Json?
  analyzedAt  DateTime? @db.Timestamptz(3)
  clientId    String?
  createdAt   DateTime  @default(now()) @db.Timestamptz(3)

  @@unique([postId, milestone])
  @@index([accountId, status])
}

// 精煉後、會被拿來指導下一篇貼文的經驗法則。
model ContentLearning {
  id              String    @id @default(cuid())
  accountId       String
  kind            String    // do | avoid | test（待驗證的假設）
  category        String    // 見 2.5 的原因分類
  statement       String    // 例：「連結放在主貼文時觸及約為中位數的 0.5 倍，改放第一則回覆」
  evidence        Json?     // [{ postId, value, vsBaseline }]
  confidence      String    // low | medium | high
  supportCount    Int       @default(0)
  contradictCount Int       @default(0)
  status          String    @default("active") // active | archived
  pinned          Boolean   @default(false)
  sourceRetrospectiveId String?
  clientId        String?
  lastValidatedAt DateTime? @db.Timestamptz(3)
  createdAt       DateTime  @default(now()) @db.Timestamptz(3)
  updatedAt       DateTime  @updatedAt @db.Timestamptz(3)

  @@index([accountId, status])
}
```

設定值放既有的 `AppSettings`（key/value）：`retrospective.underRatio`（預設 0.6）、`retrospective.overRatio`（預設 2.0）、`retrospective.trackOverperformers`（預設 true）、`retrospective.learningsNeedApproval`（預設 false）。

### 2.4 「流量不如預期」的判定（`lib/retrospective.ts`，不依賴 Next，可直接用 node:test 測）

1. **基準**：沿用 `getRecentPostPace()` 的做法——最近 60 篇有成長紀錄的貼文，在**同一個年齡**的 views 中位數。與 Today 頁的「比平常快/慢」一致，使用者不會看到兩套標準。
2. **檢查點**：
   - **24h**：主要判定點（大部分觸及在這之前發生）。
   - **7d**：最終判定，抓「後勁型」貼文；24h 判低但 7d 回到正常的，把 24h 的復盤標記為「後來回穩」，避免學到錯的教訓。
   - 3h/6h 只用在 Today 頁的「落後中」提示，不建立復盤（太早、雜訊大）。
3. **門檻**：`vsBaseline ≤ underRatio` → underperformed；`≥ overRatio` → overperformed。
4. **草稿有自訂目標時**（例如 goal = replies、hypothesis 預期回覆率 ≥ 1%），額外用目標判定，並對每個假設給 supported / rejected。
5. **樣本不足**：可比較的貼文少於 `MIN_TYPICAL_PEERS`（5）時不判定，在 UI 顯示「資料不足」；沒有成長紀錄的舊貼文改用 7d 後的總 views 對 `getBaselineMedianViews()`，並標記為近似值。
6. **冪等**：`@@unique([postId, milestone])`，同一篇同一個檢查點只建立一次。

### 2.5 證據包（`get_post_diagnostics`，伺服器端確定性計算）

讓 agent 不必自己呼叫十幾個 tool 拼湊，也讓不同 agent 的結論有一致的依據：

| 面向         | 內容（全部對照本帳號自己的歷史）                                                                                          | 來源                                                |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 成長曲線     | 1h/3h/6h/12h/24h/48h/7d 各點 vs 中位數；**從哪個時間點開始落後**（1h 就落後 → 開頭/首波觸及；6h 後才落後 → 後續擴散不足） | `milestoneReadings`、`medianAtAge`                  |
| 觸及 vs 共鳴 | 四象限：觸及低但互動率正常 → 開頭／時段／分發問題；觸及正常但互動率低 → 內容沒打中、CTA；兩者都低 → 主題與受眾不符        | views 比、互動率比（排除 shares，與全站定義一致）   |
| 時段         | 發文的星期與小時 vs 本帳號最佳時段、熱力圖該格的中位數                                                                    | `computeBestTimeToPost`、`computeDayHourHeatmap`    |
| 頻率         | 距上一篇的間隔、同一天發了幾篇（互相搶流量）                                                                              | `computePostingGapAnalysis`                         |
| 格式與長度   | media type vs 各類型中位數；長度區間 vs 最佳區間；是否為串文、幾段                                                        | `post-benchmarks`、`getLengthBucket`、`ThreadReply` |
| 文字特徵     | 有無問句、連結，以及這兩個特徵在本帳號的歷史影響                                                                          | `computeTextFeatureComparison`                      |
| 主題         | 與本帳號表現最好／最差各 3 篇的關鍵字重疊（「類似主題以前表現如何」）                                                     | `computeKeywordAnalysis` + 簡單 Jaccard             |
| 互動結構     | 讚／回覆／轉發／引用／分享各自的率 vs 中位數                                                                              | `post-benchmarks` 的 `metricRateMedians`            |
| 帳號整體     | 那幾天帳號整體 views、粉絲是否也下滑（外部因素，不是這篇的錯）                                                            | `getAccountViewTotals`、`FollowerSnapshot`          |
| 草稿         | 原始草稿 vs 實際發佈文字的差異比例、當初的假設、套用的經驗與 skills                                                       | `PostDraft`                                         |
| 相關經驗     | 與這篇同分類、已存在的經驗法則（避免重複新增）                                                                            | `ContentLearning`                                   |

原因分類（`causes[].category` 與 `ContentLearning.category` 共用）：`timing`、`frequency`、`hook`、`topic`、`audience_fit`、`format`、`length`、`thread_structure`、`link`、`cta`、`tone`、`media`、`external`、`other`。

### 2.6 MCP 介面

**讀取（`analytics:read` 即可）**

| Tool                   | 說明                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `get_content_guidance` | 生成前呼叫一次：最多 15 條有效經驗（置頂 → 信心 → 支持減反例 → 新舊排序）、最近 5 篇復盤摘要、已啟用 skills 索引、本帳號的資料面預設（最佳時段、最佳長度區間） |
| `list_retrospectives`  | 依狀態（pending / analyzed / all）、日期篩選                                                                                                                   |
| `get_post_diagnostics` | 2.5 的證據包                                                                                                                                                   |
| `list_post_drafts`     | 草稿與配對狀態                                                                                                                                                 |

`get_account_overview` 的回應加上 `pendingRetrospectives` 數量——agent 第一個呼叫就會看到，自然會提醒使用者。

**寫入（需要 `memory:write`）**

| Tool                        | 說明                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `save_post_draft`           | `parts[]`、`goal`、`hypotheses[]`、`applied_learning_ids[]`、`skills_used[]`、`planned_for`                              |
| `update_post_draft`         | 修改、標記捨棄、手動連結到某篇 `post_id`（自動配對信心不足時用）                                                         |
| `record_post_retrospective` | `summary`、`causes[]`（每個原因要附 evidence 與 confidence）、`hypothesis_verdicts[]`、`next_actions[]`                  |
| `save_content_learning`     | 新增或以 `id` 更新／封存。回應附上 `possibleDuplicates`（同分類且文字相似度高的既有經驗），引導 agent 合併而不是一直新增 |

寫入 tool 的 annotations 設 `readOnlyHint: false, destructiveHint: false`；長度上限（statement ≤ 500 字、summary ≤ 4000 字、causes ≤ 8 項）；記錄 `clientId`。

**Prompts**

- `draft-post`（參數：`topic`、`goal`、`account`）：`get_account_overview` → `get_content_guidance` → 視需要 `get_analytics` → `list_skills` 並載入相關 skill → 寫 2–3 個版本 → 逐條對照經驗法則自我檢查 → 使用者選定後 `save_post_draft`。
- `post-retrospective`（參數：`account`、`post_id` 可選）：處理所有 pending → 每篇 `get_post_diagnostics` + `get_post` → `record_post_retrospective` → 整理成 `save_content_learning`。

伺服器 `instructions`（`app/api/mcp/route.ts`）補上：「撰寫新貼文前先呼叫 get_content_guidance；有 pending retrospectives 時主動告知使用者並提議分析」。

### 2.7 觸發時機

1. **sync 後**：在 `syncAccount()` 寫完 `syncState` 之後呼叫 `settleRetrospectives(accountId)`，用 try/catch 包住並 `console.warn`，**失敗不影響 sync**（和 thread replies 的處理方式一致）。三種 sync（scheduler、手動、`/api/cron/sync`）都會經過，所以 Vercel 也適用。只掃「已滿檢查點但還沒有對應紀錄」的近 8 天貼文，成本低。
2. **agent 端**：
   - 互動式：使用者打開對話時，`get_account_overview` 帶出待復盤數量。
   - 自動化：README 說明用任何支援排程的 MCP client 定期執行 `post-retrospective` prompt（例如 Claude Code 的排程任務，或 cron 搭配 `claude -p`）。
3. **手動**：Dashboard 貼文詳情加「加入待復盤」按鈕（`trigger = manual`）。
4. **（選配，後期）伺服器端自動復盤**：使用者自備 `ANTHROPIC_API_KEY` 時，scheduler 直接呼叫模型處理 pending。這會打破「伺服器不跑 LLM」的現有定位，建議等前面穩定、確定有需求再做。

### 2.8 經驗回饋與自我驗證

- **生成時**：`get_content_guidance` 只回傳精煉後的清單，控制 context 大小；`draft-post` prompt 要求 agent 在 `save_post_draft` 時註明套用了哪些經驗。
- **自動驗證**：套用某條經驗的貼文滿 24h 判定後，伺服器自動 `supportCount + 1`（正常或高於預期）或 `contradictCount + 1`（低於預期）。反例比支持多 2 次以上時，標記為「需要重新檢視」並在 `get_content_guidance` 中降權。這讓經驗不會只增不減。
- **經驗只增不減的防護**：`possibleDuplicates` 引導合併；超過 90 天沒被驗證的 `test` 類自動降權；使用者可在 UI 置頂、編輯、封存。

### 2.9 Dashboard UI

- **新頁面 `/dashboard/playbook`**（名稱可再議，例如「經驗手冊」）：
  - 待復盤：清單 + 判定數字（例如「24h 觀看 320，平常 910，0.35×」），未分析的顯示「等待 agent 分析」與可複製的 prompt。
  - 復盤紀錄：agent 寫的摘要與原因（用既有的 `react-markdown`，不開 raw HTML）。
  - 經驗法則：分類篩選、信心、支持／反例次數、置頂／編輯／封存；若開啟「需要核准」，agent 新增的經驗先進「待核准」。
  - 草稿：狀態、配對到的貼文、配對分數，低分配對可確認或改連結。
- **貼文詳情面板**（`app/dashboard/posts/post-list.tsx`）：新增「復盤」區塊與「來自草稿」標記。
- **Today 頁**：3h/6h 落後的新貼文顯示提示；待復盤數量。
- **Settings**：「復盤」卡片調整門檻、是否追蹤高於預期、經驗是否需核准；「Connected agents」顯示每個 client 的權限（唯讀／可寫入記憶），唯讀的提示「重新連線以啟用」。
- 側邊欄新增項目（手機版放進 More 選單）；所有字串補齊 `lib/i18n.ts` 的 en / zh-TW / ja。

### 2.10 權限、相容性與安全

1. **新 scope `memory:write`**：
   - `lib/oauth.ts` 新增常數與 `SUPPORTED_SCOPES`；`.well-known/oauth-authorization-server` 與 `lib/oauth-resource-metadata.ts` 的 `scopes_supported` 一併列出。
   - `validate.ts` 改為接受支援的 scope 子集合，並把**實際核准的 scope** 傳下去（目前固定回傳 `MCP_SCOPE`）。
   - 同意頁新增可勾選的「允許 agent 儲存草稿、復盤筆記與經驗法則（不會發文或修改 Threads 上的任何東西）」，文案三語同步。
   - `withMcpAuth` 的 `requiredScopes` 維持 `analytics:read`；寫入 tool 自己檢查 `ctx.http?.authInfo?.scopes`，不足時回傳清楚的錯誤：「此連線為唯讀，請到 Settings → Connected agents 重新連線並勾選寫入權限」。
   - 既有的 token／refresh token 保持原本的唯讀 scope，不會被默默升級。
2. **記憶注入風險**：agent 寫的經驗會流進之後的 prompt。所以：UI 上全部可見可改、標示作者 client、可設定需核准、長度上限、render 時不允許 HTML。
3. **文件**：README（三語）的 "Everything is read-only" 改為「對 Threads 永遠唯讀；寫入 agent 記憶需另外授權」，並更新 tools / prompts 表格。

---

## 3. 功能二：Skills 系統

### 3.1 需求拆解

- 使用者在 Web 或 desktop 的 Dashboard 用 `npx skills add` 的語法安裝現成 skill，並能管理、更新。
- 安裝在 Threads Analytics 裡的 skill，**任何連上這個 MCP 的 agent 都能用**——包括沒有本機檔案系統的 Claude 網頁版／手機版，不必在每台電腦各裝一次。
- 提供針對 Threads 發文的推薦清單，一鍵安裝。

### 3.2 能不能直接在伺服器上跑 `npx skills add`？

調查 `skills` CLI（npm 套件 `skills` 1.7.2，vercel-labs/skills）原始碼後的結論：**不建議**。

| 事實                                                                                                                                                              | 影響                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 一般 GitHub 來源用 `git clone --depth=1`（或 `gh repo clone`）抓取；只有 `vercel`、`vercel-labs`、`heygen-com`、`remotion-dev` 這幾個 owner 走免 git 的 blob 下載 | Docker 映像（alpine）和 Vercel 沒有 `git`；desktop 只有裝了 Xcode CLT 才有           |
| 安裝結果是寫進 agent 目錄（`.claude/skills`、`.agents/skills`…）的檔案                                                                                            | Docker 容器重建、Vercel 每次呼叫都會遺失；仍然得再存進資料庫                         |
| desktop `.app` 只內嵌 `node` 執行檔，沒有 npm/npx                                                                                                                 | 要嘛另外打包 CLI，要嘛依賴使用者電腦的 Node                                          |
| 每次安裝會送 telemetry 到 skills.sh（可用 `DISABLE_TELEMETRY=1` 關閉）                                                                                            | 自架使用者可能不希望                                                                 |
| 從網頁觸發子程序                                                                                                                                                  | 參數注入／任意來源（`./local-path`、任意 URL）會變成伺服器端的檔案讀取或 SSRF 風險面 |

### 3.3 建議架構：相容 `npx skills add` 的內建安裝器

**對使用者來說「一樣是 `npx skills add`」，對伺服器來說是純 HTTP + 資料庫**：

1. **相容的來源語法**：輸入框直接貼整行 `npx skills add coreyhaines31/marketingskills --skill copywriting` 也可以，解析器忽略 `-g`、`-a`、`-y`、`--copy` 這些本機專用旗標。支援 `owner/repo`、`owner/repo@skill`、`--skill a --skill b`、`https://github.com/o/r`、`https://github.com/o/r/tree/<ref>/<path>`、`#ref`。第一版**只接受 GitHub 公開 repo**，明確拒絕本機路徑、SSH、任意 URL。
2. **抓取**（`lib/skills/github.ts`）：
   - `GET /repos/{o}/{r}` 取預設分支 → `GET /repos/{o}/{r}/git/trees/{ref}?recursive=1` 一次拿到整棵樹與 commit。
   - 依 CLI 相同的優先目錄找 `SKILL.md`（`skills/`、`.agents/skills/`、`.claude/skills/`、根目錄…，深度上限 6）。
   - 只下載被選中 skill 資料夾內的檔案（`raw.githubusercontent.com`，鎖定 commit SHA），用既有的 `createLimiter` 控制併發。
   - 限制：每個 skill ≤ 50 個檔案、單檔 ≤ 256 KB、總計 ≤ 1 MB、只收文字檔；逾時 10 秒。
   - 可選的 `GITHUB_TOKEN` 環境變數（未驗證的 GitHub API 每小時只有 60 次）。
3. **解析**（`lib/skills/frontmatter.ts`）：用 `yaml` 套件（CLI 本身也用它）解析 frontmatter，驗證 `name`（小寫連字號、≤ 64 字）、`description`（≤ 1024 字），保留 `license`、`metadata`、`allowed-tools`。
4. **雜湊**（`lib/skills/hash.ts`）：`computedHash` 與 CLI 的 `computeSkillFolderHash` 演算法相同（依相對路徑排序後，sha256(路徑 + 內容)），因此匯出的 `skills-lock.json` 能直接給本機 `npx skills experimental_install` 還原。
5. **儲存**：存進資料庫（下一節），Postgres 與 SQLite 一致，三種部署目標行為相同。
6. **更新檢查**：記錄 skill 資料夾在 GitHub 上的 tree SHA（與 CLI 全域 lock 的 `skillFolderHash` 同一個概念）；檢查更新時同一個 repo 只打一次 trees API，SHA 不同就標示「有更新」。在使用者打開 Skills 頁且上次檢查超過 24 小時時才檢查，不需要背景排程（Vercel 也適用）。
7. **搜尋**：代理 `https://skills.sh/api/search?q=&limit=`（CLI 的 `npx skills find` 用的同一支 API，回傳 name / id / source / installs）。這不是正式公開文件的 API，失敗時優雅降級成只顯示推薦清單；提供環境變數關閉。

### 3.4 資料模型

```prisma
model Skill {
  id            String      @id @default(cuid())
  name          String      @unique   // frontmatter 的 name，也是 MCP 裡的識別名稱
  description   String
  source        String                // "owner/repo"，與 skills-lock.json 的 source 相同
  sourceType    String                // github | custom（使用者在 UI 自己寫的）
  ref           String?               // 使用者指定的 branch / tag
  skillPath     String                // 例："skills/copywriting/SKILL.md"
  commitSha     String?               // 安裝時讀取的 commit
  folderTreeSha String?               // 更新偵測用
  latestTreeSha String?
  computedHash  String
  license       String?
  frontmatter   Json
  enabled       Boolean     @default(true)
  pinned        Boolean     @default(false)  // 不提示更新
  hasScripts    Boolean     @default(false)  // 含 scripts/ 或可執行檔：伺服器不執行，只提供文字
  checkedAt     DateTime?   @db.Timestamptz(3)
  installedAt   DateTime    @default(now()) @db.Timestamptz(3)
  updatedAt     DateTime    @updatedAt @db.Timestamptz(3)
  files         SkillFile[]
}

model SkillFile {
  skillId String
  skill   Skill  @relation(fields: [skillId], references: [id], onDelete: Cascade)
  path    String // 相對於 skill 資料夾，包含 "SKILL.md"
  content String
  size    Int

  @@id([skillId, path])
}
```

- 第一版 skill 為**全部帳號共用**；之後若需要不同帳號不同品牌語氣，再加 `SkillAccountSetting(skillId, accountId, enabled)`。
- 名稱衝突（兩個 repo 有同名 skill）：預設拒絕並提示「取代現有的」。

### 3.5 安裝、更新、移除流程

1. **預覽**（等同 `--list`）：輸入來源 → 列出 repo 內所有 skill（名稱、描述、檔案數、是否含 scripts）→ 勾選。
2. **檢視**：顯示完整 `SKILL.md`、檔案清單與警示（含 scripts、`allowed-tools`、外部網址、可疑的指令注入語句、無 license）。
3. **安裝**：寫入 `Skill` + `SkillFile`。
4. **更新**：顯示新舊 `SKILL.md` 的 diff，**使用者確認後才套用**（skill 的指示會直接影響 agent 行為，不做靜默自動更新）。
5. **停用／移除**：停用後 MCP 立刻看不到；移除會刪掉檔案。
6. **匯入／匯出 `skills-lock.json`**：匯入本機專案的 lock 一次裝齊；匯出後可用 `npx skills experimental_install` 在本機還原同一組 skill。
7. 以上全部是 `actions/skills.ts` 的 server actions，經過既有的 `requireSession()`（web 需登入；desktop 只聽 loopback、無登入）。**MCP 不提供安裝功能**，避免 agent 自行安裝含惡意指示的 skill。

### 3.6 透過 MCP 提供給 agent

MCP 沒有原生的「skill」概念，而各 client 對 resources / prompts 的支援程度不一，所以**以 tools 為主**，對應 Agent Skills 的漸進式載入：

| 介面                                         | 說明                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `list_skills`（tool）                        | 只回傳已啟用 skill 的 name、description、來源、是否有參考檔——對應 skill 的 metadata 階段，context 很小 |
| `get_skill`（tool）                          | 回傳 `SKILL.md` 本文與檔案清單；含 scripts 的會加註「伺服器不執行，僅供參考」                          |
| `get_skill_file`（tool）                     | 讀取 skill 裡的參考檔（例如 `references/hooks.md`）                                                    |
| `use-skill`（prompt，參數 `name`）           | 讓使用者在 client 裡手動叫出某個 skill（例如 Claude Code 的 `/mcp__threads-analytics__use-skill`）     |
| `skill://{name}/{path}`（resource template） | 給支援 resources 的 client（例如 Claude Code 的 @ 提及）                                               |

- `get_content_guidance` 與 `draft-post` prompt 會帶出 skills 索引並要求 agent 先載入相關的 skill。
- `save_post_draft.skills_used` 記錄每篇用了哪些 skill（含 `computedHash`），之後就能統計「用了 skill X 的貼文，24h vsBaseline 中位數是多少」，把兩個功能接起來，回答「這個 skill 到底有沒有幫助」。

### 3.7 UI：`/dashboard/skills`

- **已安裝**：啟用開關、來源連結、版本（commit 前 7 碼）、「有更新」標籤、更新（含 diff）、移除、檢視內容；顯示「用過這個 skill 的貼文表現」（3.6 的統計，有資料時才顯示）。
- **推薦**：3.9 的清單，一鍵安裝。
- **搜尋**：skills.sh 搜尋結果與安裝數。
- **安裝框**：可貼 `npx skills add …` 整行或 `owner/repo`。
- **自訂 skill**（後期）：在 UI 直接寫一個 `SKILL.md`，例如「我的寫作語氣」；更進一步可以讓 agent 依帳號表現最好的貼文產生一份語氣 skill 草稿，使用者確認後存成 `sourceType = custom`。
- desktop：同一套 Next 頁面；若要開啟 GitHub / skills.sh 外部連結，需把網域加進 `desktop/app.json` 的 `external_links` 白名單。

### 3.8 安全

- 只接受 GitHub https 來源，拒絕本機路徑與任意 URL（防 SSRF 與讀取伺服器檔案）。
- 檔案數量、大小、類型限制；內容一律當文字存，render 不開 HTML。
- 安裝前完整預覽、更新需確認 diff、記錄 commit 以便追溯。
- 推薦清單鎖定審閱過的 commit 與 `computedHash`，有新版時顯示「新版本尚未經過審閱」。
- 伺服器永遠不執行 skill 裡的 scripts。
- agent 只能讀取已啟用的 skill，不能安裝。

### 3.9 推薦 Skills 清單

<!-- RECOMMENDED_SKILLS -->

> 調查中：每個候選 skill 都會先確認 repo 與 SKILL.md 實際存在後再列入。

---

## 4. 兩個功能的整合點

1. `get_content_guidance` = 經驗法則 + 最近復盤 + 已啟用 skills 索引 + 資料面預設——**生成前只要一次呼叫**。
2. `draft-post` prompt 串起：資料 → 經驗 → skills → 多版本 → 自我檢查 → `save_post_draft`。
3. 草稿記錄 `applied_learning_ids` 與 `skills_used` → 貼文成績同時驗證經驗與 skill 的效果。
4. 第一方 skill `threads-post-retrospective` 把復盤方法論寫成 skill，`post-retrospective` prompt 直接引用，也能讓使用者在本機的 Claude Code 使用同一套流程。

---

## 5. 分階段實作（建議的 PR 切分）

| 階段 | PR              | 內容                                                                                                                                                                                                              |
| ---- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | 寫入權限基礎    | `memory:write` scope、`validate.ts` 回傳實際核准的 scope、同意頁勾選、metadata 的 `scopes_supported`、Connected agents 顯示權限、寫入 tool 的 scope 檢查 helper、README 三語文案；OAuth 測試                      |
| 1    | 復盤資料層      | 三個 model（Postgres + SQLite migration）、`tests/support/fake-db.mjs` 支援新 model、純函式模組 `lib/retrospective.ts`（判定）與 `lib/draft-matching.ts`（字元 bigram Dice 相似度、時間窗）＋單元測試             |
| 1    | sync 整合 + MCP | `settleRetrospectives()` 掛進 `syncAccount()`、`get_post_diagnostics`、2.6 的 tools 與兩個 prompts、`get_account_overview` 加待復盤數量、server instructions；MCP 測試（含 scope 不足的情境）                     |
| 1    | 復盤 UI         | Playbook 頁、貼文詳情的復盤區塊、Today 提示、Settings 門檻卡片、i18n 三語                                                                                                                                         |
| 2    | Skills 安裝核心 | 來源解析（含整行 `npx skills add` 指令）、GitHub 抓取、SKILL.md 探索、frontmatter 驗證、`computedHash`、`Skill` / `SkillFile` model、server actions；以假的 fetch 測試（仿 `tests/support/fake-threads-api.mjs`） |
| 2    | Skills UI       | `/dashboard/skills`：預覽安裝、已安裝管理、更新檢查與 diff、推薦、搜尋、lock 匯入匯出                                                                                                                             |
| 2    | Skills × MCP    | `list_skills` / `get_skill` / `get_skill_file`、`use-skill` prompt、resource template、併入 `get_content_guidance` 與 `draft-post`、skill 成效統計                                                                |
| 3    | 第一方 skills   | 本 repo 新增 `skills/threads-post-writer`、`skills/threads-post-retrospective`（en / zh-TW），列入推薦；本機也能 `npx skills add ridemountainpig/threads-analytics`                                               |
| 選配 | 之後再評估      | 透過 Threads API 直接發文（需 `threads_content_publish` 權限，草稿配對變成精確連結）、伺服器端 BYOK 自動復盤、帳號別 skill、依最佳貼文產生個人語氣 skill                                                          |

兩個功能彼此獨立，階段 1 和階段 2 可以平行開發；整合點（`get_content_guidance` 的 skills 段落、`skills_used` 統計）放在「Skills × MCP」那個 PR。

---

## 6. 測試計畫

- **純函式**（node:test + type stripping，沿用 `tests/*.test.mjs` 慣例）：判定門檻與邊界（樣本不足、24h 與 7d 結果不一致）、草稿配對（繁中、全形標點、使用者小幅修改後仍能配對、不同貼文不誤配）、來源與指令解析、frontmatter 驗證、`computedHash` 與 CLI 結果一致（用 CLI 實際算出的 hash 當 fixture）。
- **MCP**（`tests/mcp-server.test.mjs`）：handler 第二個參數傳入帶 scopes 的 context，驗證唯讀 token 呼叫寫入 tool 會被拒絕、可寫 token 正常寫入；`get_content_guidance` 的排序與數量上限。
- **sync**（`tests/sync-service.test.mjs`）：復盤判定失敗不會讓 sync 失敗；重複 sync 不會重複建立紀錄。
- **OAuth**：scope 子集合驗證、舊 token 維持唯讀、token 回應帶正確的 `scope`。
- **schema parity / desktop migrate**：既有的 `desktop/tests/schema-parity.test.mjs` 與 `migrate.test.mjs` 會自動涵蓋兩份 schema。

---

## 7. 需要你決定的事項

1. **發文方式**：維持「agent 寫、你手動發、sync 自動配對」（建議先做這個），還是也要讓 agent 透過 Threads API 直接發文？後者需要 token 有 `threads_content_publish` 權限，而且是很大的信任升級（agent 能代你發文）。
2. **判定門檻**：預設「24h 觀看 ≤ 平常同年齡中位數的 0.6 倍」是否合適？
3. **經驗法則是否需要你核准**才會生效（預設：自動生效，但隨時可改可封存）？
4. **是否也復盤表現特別好的貼文**（預設：是，≥ 2 倍）？
5. **Skills 是否全帳號共用**（預設：是），還是一開始就要帳號別設定？
6. **是否需要伺服器端自動復盤**（自備 API key）？預設不做，維持「伺服器不跑 LLM」。

---

## 8. 風險與限制

| 風險                                          | 對策                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| agent 寫入的經驗反過來污染之後的生成          | 全部可見可改、標示作者、可設定需核准、長度限制、反例自動降權 |
| 新帳號或貼文少，中位數不可靠                  | `MIN_TYPICAL_PEERS` 以下不判定，UI 顯示資料不足              |
| 舊貼文沒有成長紀錄                            | 改用 7d 總 views 近似判定並標記                              |
| 草稿配對誤判                                  | 高門檻才自動連結，中間區間要人工／agent 確認，可隨時改連結   |
| 第三方 skill 含惡意或過時指示                 | 預覽、diff 確認、鎖定 commit、推薦清單審閱、agent 不能安裝   |
| GitHub API 頻率限制                           | 同 repo 合併請求、檢查更新有 24h 冷卻、可設 `GITHUB_TOKEN`   |
| skills.sh 搜尋 API 非正式、可能變動           | 失敗時降級為推薦清單、可用環境變數關閉                       |
| 各 MCP client 對 prompts / resources 支援不一 | 核心功能全部用 tools 實作，prompts / resources 只是加分      |
