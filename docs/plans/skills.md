# Skills 系統：分析與實作規劃

> 狀態：規劃草案（尚未實作），依目前 `main`（0.1.1）的程式碼撰寫。範圍只含 Skills；貼文復盤延後，先前的規劃保留在 commit `038dce3` 的 `docs/plans/post-retrospective-and-skills.md`。

## 0. 結論摘要

| 項目          | 建議                                                                                                                                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目標          | 使用者在 Web 或 desktop 的 Dashboard 安裝、管理、更新現成 skill；任何連上這個 MCP 的 agent 撰寫貼文時都能使用，包括沒有本機檔案系統的 Claude 網頁版／手機版，不必在每台電腦各裝一次。                                                     |
| 安裝方式      | **不在伺服器上真的執行 `npx skills add`**（需要 `git`，也需要可寫且持久的檔案系統，Docker / Vercel / desktop 都不保證有）。改做「**相容 `npx skills add` 語法與 `skills-lock.json` 格式**」的內建安裝器：直接從 GitHub 讀檔、存進資料庫。 |
| 給 agent 使用 | 以 MCP **tools** 為主（`list_skills` → `get_skill` → `get_skill_file`，對應 Agent Skills 的漸進式載入），加上 `draft-post` prompt 讓 agent 寫貼文時先載入相關 skill。agent 只能讀取「已啟用」的 skill，不能安裝。                         |
| 權限          | 全部是讀取，沿用現有的 `analytics:read`。**OAuth、同意頁與「MCP 唯讀」的承諾都不用改**，已連線的 agent 不必重新授權。安裝只能由使用者在 Dashboard 操作。                                                                                  |
| 推薦 skills   | 預設推薦 `social`、`speak-human-tw` 或 `humanizer-zh-tw`、`stop-slop`、`copywriting`／`copy-editing`，全部 MIT、純文字。詳見 [第 9 節](#9-推薦-skills-清單)。                                                                             |
| 第一步        | 本 repo 先發佈第一方 skill `threads-post-writer`：不用寫 app 程式碼，本機就能 `npx skills add` 安裝，也是之後安裝器的測試範例。                                                                                                           |

---

## 1. 現況盤點

1. **MCP 目前全部唯讀**：只有 `analytics:read`（`lib/oauth.ts`）。Skills 對 agent 只提供讀取，剛好落在這個範圍內。
2. **部署目標各有限制**：Docker（`node:24-alpine`，沒有 `git`，容器可能隨時重建）、Vercel（serverless，只有 `/tmp` 可寫，沒有 `git`）、Railway／Zeabur、desktop（`.app` 只內嵌 `node` 執行檔，沒有 npm／npx；`git` 只有裝了 Xcode CLT 才有）。
3. **兩套資料庫**：Postgres（`prisma/schema.prisma`）與 desktop SQLite（`desktop/runtime/prisma/schema.prisma`），`desktop/tests/schema-parity.test.mjs` 強制兩邊 model 一致，migration 兩邊各寫一份。
4. **MCP SDK 能力**：`mcp-handler` 2.3 支援非同步的 server 初始化函式與 `registerResource`，可以依資料庫內容動態註冊 prompt 與 resource。
5. **MCP 程式集中在 `lib/mcp-server.ts`（1,215 行）**：新的 skills tools 建議放在獨立模組（例如 `lib/mcp/skills-tools.ts`），由 `registerMcpServer()` 呼叫。
6. **Repo 本身已在用 `npx skills add`**：`skills-lock.json` 與 `.agents/skills/native-sdk`（`.claude/skills/native-sdk` 是指向它的 symlink）。

---

## 2. 能不能直接在伺服器上跑 `npx skills add`？

讀過 `skills` CLI（npm 套件 `skills` 1.7.2，vercel-labs/skills）的原始碼後，結論是**不建議**：

| 事實                                                                                                                                                              | 影響                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 一般 GitHub 來源用 `git clone --depth=1`（或 `gh repo clone`）抓取；只有 `vercel`、`vercel-labs`、`heygen-com`、`remotion-dev` 這幾個 owner 走免 git 的 blob 下載 | Docker 映像（alpine）和 Vercel 沒有 `git`；desktop 只有裝了 Xcode CLT 才有           |
| 安裝結果是寫進 agent 目錄（`.claude/skills`、`.agents/skills`…）的檔案                                                                                            | Docker 容器重建、Vercel 每次呼叫都會遺失；仍然得再存進資料庫                         |
| desktop `.app` 只內嵌 `node` 執行檔，沒有 npm/npx                                                                                                                 | 要嘛另外打包 CLI，要嘛依賴使用者電腦的 Node                                          |
| 每次安裝會送 telemetry 到 skills.sh（可用 `DISABLE_TELEMETRY=1` 關閉）                                                                                            | 自架使用者可能不希望                                                                 |
| 從網頁觸發子程序                                                                                                                                                  | 參數注入／任意來源（`./local-path`、任意 URL）會變成伺服器端的檔案讀取或 SSRF 風險面 |

---

## 3. 架構：相容 `npx skills add` 的內建安裝器

**對使用者來說「一樣是 `npx skills add`」，對伺服器來說是純 HTTP + 資料庫**：

1. **相容的來源語法**（`lib/skills/source.ts`）：輸入框直接貼整行 `npx skills add coreyhaines31/marketingskills --skill copywriting` 也可以，解析器忽略 `-g`、`-a`、`-y`、`--copy` 這些本機專用旗標。支援 `owner/repo`、`owner/repo@skill`、`--skill a --skill b`（也接受一個 `--skill` 後面接多個名稱）、`https://github.com/o/r`、`https://github.com/o/r/tree/<ref>/<path>`、`#ref`。第一版**只接受 GitHub 公開 repo**，明確拒絕本機路徑、SSH、任意 URL。
2. **抓取**（`lib/skills/github.ts`）：
   - `GET /repos/{o}/{r}` 取預設分支 → `GET /repos/{o}/{r}/git/trees/{ref}?recursive=1` 一次拿到整棵樹與 commit。
   - 依 CLI 相同的探索規則找 `SKILL.md`（`lib/skills/discover.ts`）：先看根目錄、`skills/`（含 `.curated` / `.experimental` / `.system`）、各 agent 的 `skills/` 目錄與 `.claude-plugin` manifest，淺層的 `SKILL.md` 會遮蔽更深層的；都找不到才遞迴搜尋。與 CLI 一樣預設不做 `--full-depth`。
   - 只下載被選中 skill 資料夾內的檔案（`raw.githubusercontent.com`，鎖定 commit SHA），用既有的 `createLimiter`（`lib/concurrency.ts`）控制併發。
   - 限制：每個 skill ≤ 50 個檔案、單檔 ≤ 256 KB、總計 ≤ 1 MB、只收文字檔；逾時 10 秒。
   - 可選的 `GITHUB_TOKEN` 環境變數（未驗證的 GitHub API 每小時只有 60 次），寫進 `.env.example` 與 README。
3. **解析**（`lib/skills/frontmatter.ts`）：用 `yaml` 套件（CLI 本身也用它，需新增為依賴）解析 frontmatter，驗證 `name`（小寫連字號、≤ 64 字）、`description`（≤ 1024 字），保留 `license`、`metadata`、`allowed-tools`。
4. **雜湊**（`lib/skills/hash.ts`）：`computedHash` 與 CLI 的 `computeSkillFolderHash` 演算法相同（依相對路徑排序後，sha256(路徑 + 內容)），因此匯出的 `skills-lock.json` 能直接給本機 `npx skills experimental_install` 還原。
5. **儲存**（`lib/skills/store.ts`）：存進資料庫（第 4 節），Postgres 與 SQLite 一致，三種部署目標行為相同。
6. **更新檢查**：記錄 skill 資料夾在 GitHub 上的 tree SHA（與 CLI 全域 lock 的 `skillFolderHash` 同一個概念）；檢查時同一個 repo 只打一次 trees API，SHA 不同就標示「有更新」。只在使用者打開 Skills 頁、且上次檢查超過 24 小時時才檢查，不需要背景排程（Vercel 也適用）。
7. **搜尋**（`lib/skills/registry.ts`）：代理 `https://skills.sh/api/search?q=&limit=`（CLI 的 `npx skills find` 用的同一支 API，回傳 name / id / source / installs）。這不是正式公開文件的 API，失敗時優雅降級成只顯示推薦清單；提供環境變數關閉。

---

## 4. 資料模型

```prisma
model Skill {
  id            String      @id @default(cuid())
  // MCP 裡的識別名稱，預設等於 name；同名衝突時改為 "<name>-<owner>" 或由使用者自訂
  slug          String      @unique
  name          String                // frontmatter 的 name
  description   String
  source        String                // "owner/repo"，與 skills-lock.json 的 source 相同
  sourceType    String                // github（之後可加 custom：使用者在 UI 自己寫的）
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

  @@unique([source, name])
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

- 第一版 skill **全部帳號共用**；之後若需要不同帳號不同品牌語氣，再加 `SkillAccountSetting(skillId, accountId, enabled)`。
- 名稱衝突很常見：調查時就發現 `hook-writer`、`voice-builder`、`threads-post`、`humanizer` 在好幾個 repo 都有同名 skill，而 CLI 以名稱安裝，會互相覆蓋。所以這裡以 `source + name` 為唯一鍵，另用 `slug` 當 MCP 名稱；衝突時讓使用者選「取代」或「並存（改 slug）」。
- 每個帳號的「帳號定位與語氣」（第 6 節）存在既有的 `AppSettings`，不另開 model。

---

## 5. 安裝、更新、移除流程

1. **預覽**（等同 `--list`）：輸入來源 → 列出 repo 內所有 skill（名稱、描述、檔案數、是否含 scripts）→ 勾選。
2. **檢視**：顯示完整 `SKILL.md`、檔案清單與警示（含 scripts、`allowed-tools`、外部網址、可疑的指令注入語句、無 license）。
3. **安裝**：寫入 `Skill` + `SkillFile`。
4. **更新**：顯示新舊 `SKILL.md` 的 diff，**使用者確認後才套用**（skill 的指示會直接影響 agent 行為，不做靜默自動更新）。
5. **停用／移除**：停用後 MCP 立刻看不到；移除會刪掉檔案。
6. **匯入／匯出 `skills-lock.json`**：匯入本機專案的 lock 一次裝齊；匯出後可用 `npx skills experimental_install` 在本機還原同一組 skill。
7. 以上全部是 `actions/skills.ts` 的 server actions，經過既有的 `requireSession()`（web 需登入；desktop 只聽 loopback、無登入）。**MCP 不提供安裝功能**，避免 agent 自行安裝含惡意指示的 skill。

---

## 6. 透過 MCP 提供給 agent

MCP 沒有原生的「skill」概念，各 client 對 resources / prompts 的支援程度也不一，所以**以 tools 為主**，對應 Agent Skills 的漸進式載入：

| 介面                                         | 說明                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `list_skills`（tool）                        | 只回傳已啟用 skill 的 slug、description、來源、是否有參考檔——對應 skill 的 metadata 階段，context 很小              |
| `get_skill`（tool）                          | 回傳 `SKILL.md` 本文與檔案清單；含 scripts 的會加註「伺服器不執行，僅供參考」                                       |
| `get_skill_file`（tool）                     | 讀取 skill 裡的參考檔（例如 `references/hooks.md`）                                                                 |
| `get_content_guidance`（tool）               | 寫貼文前呼叫一次：帳號定位與語氣、已啟用 skills 索引、本帳號的資料面預設（最佳時段、最佳長度區間、表現最好的格式）  |
| `draft-post`（prompt）                       | 參數 `topic`、`account`：`get_account_overview` → `get_content_guidance` → 載入相關 skill → 寫 2–3 個版本並自我檢查 |
| `use-skill`（prompt，參數 `name`）           | 讓使用者在 client 裡手動叫出某個 skill（例如 Claude Code 的 `/mcp__threads-analytics__use-skill`）                  |
| `skill://{slug}/{path}`（resource template） | 給支援 resources 的 client（例如 Claude Code 的 @ 提及）                                                            |

- 所有新 tool 都標 `readOnlyHint: true`，與既有 tools 一致。
- 伺服器 `instructions`（`app/api/mcp/route.ts`）補上：「撰寫貼文前，先呼叫 get_content_guidance，並用 get_skill 載入相關的 skill」。
- `get_content_guidance` 的名稱刻意保留通用：之後做復盤時，經驗法則直接加進同一個回應，不必再改 prompt。
- **context 檔案的落差**：多數現成 skill 預期本機有一份脈絡檔（例如 `.agents/product-marketing.md`、`brand-style.md`、`brand-profile` skill），而且會把輸出寫成檔案。透過 MCP 使用時這些都不存在，所以：
  - Settings 新增每個帳號的「帳號定位與語氣」文字欄位，由 `get_content_guidance` 回傳。
  - `get_skill` 回應附上固定說明：「此 skill 提到的脈絡檔在此環境不存在，請以 get_content_guidance 的帳號定位取代；不要寫入檔案，直接把草稿回覆給使用者」。
- README（三語）的 tools / prompts 表格同步更新。

---

## 7. UI：`/dashboard/skills`

- **已安裝**：啟用開關、來源連結、版本（commit 前 7 碼）、「有更新」標籤、更新（含 diff）、移除、檢視內容。
- **推薦**：第 9 節的清單，一鍵安裝。
- **搜尋**：skills.sh 搜尋結果與安裝數。
- **安裝框**：可貼 `npx skills add …` 整行或 `owner/repo`。
- **匯入／匯出**：`skills-lock.json`。
- 側邊欄新增項目（手機版放進 More 選單）；字串補齊 `lib/i18n.ts` 的 en / zh-TW / ja。
- Settings 新增「帳號定位與語氣」卡片（每個帳號一個文字欄位）。
- desktop：同一套 Next 頁面；若要開啟 GitHub / skills.sh 外部連結，需把網域加進 `desktop/app.json` 的 `external_links` 白名單。

---

## 8. 安全

- 只接受 GitHub https 來源，拒絕本機路徑與任意 URL（防 SSRF 與讀取伺服器檔案）。
- 檔案數量、大小、類型限制；內容一律當文字存，render 時用既有的 `react-markdown`，不開 raw HTML。
- 安裝前完整預覽、更新需確認 diff、記錄 commit 以便追溯。
- 推薦清單鎖定審閱過的 commit 與 `computedHash`，有新版時顯示「新版本尚未經過審閱」。
- 伺服器永遠不執行 skill 裡的 scripts。
- agent 只能讀取已啟用的 skill，不能安裝。

---

## 9. 推薦 Skills 清單

調查方式：每個候選都實際 clone repo、讀過 `SKILL.md`，並在暫存目錄用 `DISABLE_TELEMETRY=1 npx skills@1.7.2 add <repo> --list` 確認 CLI 找得到該名稱（沒有實際安裝）。GitHub 星數為 2026-10-19 讀取的數字；skills.sh 在調查環境無法連線，安裝數取自搜尋引擎快照，標「約」的僅供參考。「純文字」指只有 Markdown，沒有 scripts、網路呼叫或瀏覽器依賴——這類最適合透過 MCP 提供給遠端 agent。

### 預設推薦（一鍵安裝，標示「推薦」）

| Skill             | 安裝指令                                                            | 為什麼適合 Threads                                                                                        | 授權／規模          | 注意事項                                                                                                         |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `social`          | `npx skills add coreyhaines31/marketingskills --skill social`       | hook、內容再利用、內容日曆；`references/platform-limits.md` 有 Threads 章節（500 字、每篇一個主題標籤等） | MIT，55.5k★         | 描述沒提 Threads；會讀 `.agents/product-marketing.md`；附的工具清單含付費合作夥伴。舊名 `social-content` 已改名  |
| `speak-human-tw`  | `npx skills add Raymondhou0917/speak-human-tw`                      | 繁中去 AI 味＋台灣用語在地化（`references/taiwan-localization.md`），社群貼文情境明列 Threads，採輕度修改 | MIT，1.1k★          | 預設會先列修改建議、等使用者回覆；無法回覆時退回「跳過確認、事後摘要」                                           |
| `humanizer-zh-tw` | `npx skills add kevintsai1202/Humanizer-zh-TW`                      | 繁中潤飾：刪空話、重複與公式化表達，保留事實與作者聲音；同步上游 op7418/Humanizer-zh 2026-09-23 版        | MIT，900★           | 不要加 `--full-depth`，否則會一起裝到需要 Python 的 `text-watermark-cleaner-zh-tw`。與 `speak-human-tw` 擇一即可 |
| `stop-slop`       | `npx skills add hardikpandya/stop-slop`                             | 只有 2.6 KB 的去 AI 味規則，小到每次生成都能載入                                                          | MIT，18.1k★         | 以英文為主                                                                                                       |
| `copywriting`     | `npx skills add coreyhaines31/marketingskills --skill copywriting`  | 標題、hook 寫法與 AI 痕跡參考檔                                                                           | MIT，約 22.7 萬安裝 | 原本為 landing page 文案設計                                                                                     |
| `copy-editing`    | `npx skills add coreyhaines31/marketingskills --skill copy-editing` | 草稿最後一輪的精簡與潤稿                                                                                  | MIT                 | 同上                                                                                                             |

建議的預設組合：繁中帳號用 `social` + `speak-human-tw`（或 `humanizer-zh-tw`，擇一以免指示互相衝突）+ `copywriting`；英文帳號把繁中那個換成 `stop-slop`。

### Threads 專屬，但有廠商綁定或授權問題（列為「可選」並在 UI 顯示警示）

| Skill                                                     | 安裝指令                                                                                                  | 優點                                                                                                  | 為什麼不放預設                                                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `threads-post`、`hook-writer`                             | `npx skills add social-media-skills/skills --skill threads-post hook-writer`                              | 找到最新的 Threads 演算法筆記（`references/threads-2026-reality.md`）：回覆比讚重要、互動速度決定分發 | MIT、170★，但由 WoopSocial 團隊維護，流程假設用 WoopSocial 發文，且依賴同 repo 的 `brand-profile`、`goals-and-kpis`                               |
| `post-writer-sms`、`thread-writer-sms`、`hook-writer-sms` | `npx skills add blacktwist/social-media-skills --skill post-writer-sms thread-writer-sms hook-writer-sms` | 每個都有 Threads 段落（500 字、最多一個 hashtag、對話口吻、範例）                                     | MIT、577★，但 BlackTwist 是 Threads 排程／分析產品（與本專案定位重疊），內含「Publishing with BlackTwist」MCP 段落                                |
| `threads-writer`                                          | `npx skills add stevenflanagan1/social-ai-team --skill threads-writer`                                    | 唯一專門的 Threads 寫手：每篇強制計算 500 字、3–7 則串文、不用 hashtag、「Threads 獎勵觀點而非技巧」  | **沒有 LICENSE 檔**（README 只寫 "use it, adapt it, build on it"）；每篇加上 Blotato 發佈標記並寫出檔案。不建議推薦，也不要複製內容進第一方 skill |

### 進階／特定需求

| Skill                                                          | 安裝指令                                                                                                   | 用途                                       | 注意事項                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------- |
| `content-strategy`、`marketing-psychology`                     | `npx skills add coreyhaines31/marketingskills --skill content-strategy marketing-psychology`               | 內容支柱、編輯日曆、行為心理學             | MIT；各約 20 KB，適合規劃而非每篇生成                                         |
| `voice-builder`                                                | `npx skills add charlie947/social-media-skills --skill voice-builder`                                      | 透過訪談＋3–5 篇範文建立個人語氣檔         | MIT；同 repo 其他 skill 偏 LinkedIn，部分需要 Apify / Gemini                  |
| `humanizer`                                                    | `npx skills add blader/humanizer`                                                                          | 最受歡迎的英文 humanizer（58.3k★）         | MIT；32 KB、只有英文                                                          |
| `chinese-content-writing-guideline`、`writing-style-guideline` | `npx skills add jim60105/copilot-prompt --skill chinese-content-writing-guideline writing-style-guideline` | 繁中標點、全半形、空格、稱謂與台灣用語規範 | **GFDL-1.3**（copyleft，轉散布內容時要注意）；22★；附選用的 `scripts/lint.sh` |

### 調查過但不建議

- `typefully/agent-skills`：支援 Threads，但需要 `TYPEFULLY_API_KEY` 並執行 `scripts/typefully.js`。
- `publora/skills` 的 `threads-post`：需要 Publora MCP server。
- `itchernetski/threads-carousel-claude-skill`：需要 Next.js app 與瀏覽器匯出。
- `op7418/Humanizer-zh`：中文最熱門（20.1k★），但輸出簡體中文；改用上面的 kevintsai1202 繁中 fork。
- Anthropic 的 `brand-guidelines`：只套用 Anthropic 自家品牌。

### 第一方 skill：`threads-post-writer`

調查結果顯示**沒有一個 Threads 專屬 skill 同時滿足「授權清楚、不綁發文廠商、支援繁中」**，所以建議本 repo 自己發佈 `skills/threads-post-writer/`：

- 內容：Threads 平台規則（500 字、主題標籤、串文結構、連結放置）、hook 與引導回覆的寫法、依帳號貼文的語言撰寫，範例放在 `references/`（en、zh-TW、ja）。
- 用法：指示 agent 先用既有的 MCP tools 讀資料（`get_account_overview`、`get_analytics` 的 `best_time_to_post`、`post_length_analysis`、`text_feature_comparison`、`keyword_analysis`，以及 `list_posts` + `get_post` 讀表現最好的貼文）；`get_content_guidance` 上線後改成優先呼叫它。所以**現在的 MCP 就能用**，不必等安裝器。
- 本機安裝：`npx skills add ridemountainpig/threads-analytics --skill threads-post-writer`。一定要帶 `--skill`，因為 repo 裡也有開發用的 `native-sdk` skill（`.agents/skills/`），不帶的話 CLI 會一起列出來。
- 內容自行撰寫，不複製上面任何 skill 的文字（特別是沒有授權的 `threads-writer` 與 GFDL 的規範文件）。

`lib/skills/recommended.ts` 每一筆記錄 `source`、`skill`、審閱過的 commit 與 `computedHash`、分類、適用語言、為什麼推薦、注意事項，UI 直接拿來顯示上面這些說明；第一方 skill 排在最前面。

---

## 10. 實作順序（建議的 PR 切分）

| #   | PR                 | 內容                                                                                                                                                                                                                                                                        |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 第一方 skill       | `skills/threads-post-writer/`（`SKILL.md` + `references/`），README 三語加上本機安裝方式。不動 app 程式碼。                                                                                                                                                                 |
| 2   | 安裝核心 + 最小 UI | `lib/skills/`（source、github、discover、frontmatter、hash、store）、`Skill` / `SkillFile` model 與兩份 migration、`tests/support/fake-db.mjs` 支援新 model、`actions/skills.ts`、新增 `yaml` 依賴；`/dashboard/skills` 先只有「貼來源 → 安裝」與已安裝清單（啟用、移除）。 |
| 3   | Skills × MCP       | `list_skills` / `get_skill` / `get_skill_file`、`get_content_guidance`、`draft-post` 與 `use-skill` prompts、resource template、server instructions、Settings 的「帳號定位與語氣」、README 三語 tools / prompts 表格。做完這個 PR，就能從安裝一路用到 agent 寫貼文。        |
| 4   | 完整 UI            | 安裝前預覽與警示、更新檢查與 diff 確認、推薦清單、skills.sh 搜尋、`skills-lock.json` 匯入匯出、名稱衝突處理、側邊欄與 i18n。                                                                                                                                                |

PR 2 先做最小 UI，是為了讓 PR 3 一完成就有一條能實際操作的完整路徑；預覽、diff、推薦這些體驗面的東西放到 PR 4。

---

## 11. 測試計畫

沿用 `tests/*.test.mjs`（node:test + type stripping）的慣例：

- **來源解析**：各種 `npx skills add` 寫法（`--skill` 重複或一次多個、`owner/repo@skill`、GitHub tree URL、`#ref`）；本機路徑、SSH、非 GitHub URL 一律拒絕。
- **SKILL.md 探索**：以假的 GitHub tree 驗證優先目錄、淺層遮蔽深層、遞迴退路，結果與 CLI `--list` 一致。
- **frontmatter**：缺 name / description、超長、非法字元、多行 description。
- **`computedHash`**：用 CLI 實際算出的 hash 當 fixture，確認結果一致。
- **GitHub 抓取**：仿 `tests/support/fake-threads-api.mjs` 做假的 fetch；涵蓋 rate limit、逾時、檔案過大、二進位檔、私有 repo 的 404。
- **MCP**（`tests/mcp-server.test.mjs`）：停用的 skill 不出現在 `list_skills`，`get_skill` 也拿不到；`get_skill_file` 拒絕 `../` 之類跳出 skill 資料夾的路徑。
- **schema parity / desktop migrate**：既有的 `desktop/tests/schema-parity.test.mjs` 與 `migrate.test.mjs` 會自動涵蓋兩份 schema。

---

## 12. 需要你決定的事項

1. **Skills 是否全帳號共用**（預設：是），還是一開始就要帳號別設定？
2. **skills.sh 搜尋**：它是非正式的外部 API，預設開啟、可用環境變數關閉，這樣可以嗎？
3. **推薦清單是否收錄綁廠商的 Threads 專屬 skill**（預設：列為「可選」並顯示警示）？
4. **第一方 skill 的語言**：單一 skill 依帳號貼文語言撰寫（建議），還是每種語言各一個 skill？
5. **私有 repo**：第一版只支援公開 repo；要不要一開始就透過 `GITHUB_TOKEN` 支援私有 repo？

---

## 13. 風險與限制

| 風險                                          | 對策                                                           |
| --------------------------------------------- | -------------------------------------------------------------- |
| 第三方 skill 含惡意或過時的指示               | 預覽、diff 確認、鎖定 commit、推薦清單審閱、agent 不能安裝     |
| GitHub API 頻率限制                           | 同 repo 合併請求、檢查更新有 24h 冷卻、可設 `GITHUB_TOKEN`     |
| skills.sh 搜尋 API 非正式、可能變動           | 失敗時降級為推薦清單、可用環境變數關閉                         |
| 各 MCP client 對 prompts / resources 支援不一 | 核心功能全部用 tools 實作，prompts / resources 只是加分        |
| 現成 skill 預期本機的脈絡檔、會寫出檔案       | 帳號定位與語氣設定 + `get_skill` 回應附上的固定說明            |
| skill 本文太長，佔掉 agent 的 context         | `list_skills` 只給摘要，本文按需載入；UI 顯示每個 skill 的大小 |

---

## 14. 之後可以延伸

- **自訂 skill**：在 UI 直接寫一個 `SKILL.md`（`sourceType = custom`），或讓 agent 依帳號表現最好的貼文產生一份個人語氣 skill，使用者確認後存起來。
- **帳號別的 skill 設定**：`SkillAccountSetting`。
- **更多來源**：GitLab、其他 git 主機。
- **與貼文復盤整合**：復盤功能上線後，草稿記錄用了哪些 skill（含 `computedHash`），就能統計每個 skill 對貼文表現的實際影響。
