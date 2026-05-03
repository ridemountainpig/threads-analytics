<p align="center">
  <img src="public/threads-analytics-icon.png" alt="Threads Analytics icon" width="92" />
</p>
<h1 align="center">Threads Analytics</h1>
<p align="center">
  自架的 Threads 數據分析儀表板。連接 Access Token，用詳細圖表與指標深入了解你的貼文表現。
</p>
<p align="center">
  <a href="./README-zh.md">繁體中文</a> · <a href="./README.md">English</a>
</p>

---

## 快速開始

```bash
git clone https://github.com/ridemountainpig/threads-analytics.git
cd threads-analytics
pnpm install
cp .env.example .env.local # 或手動建立 .env.local
npx prisma migrate dev --name init
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000)，使用 `APP_PASSWORD` 登入。

---

## 功能

- **總覽** — 數據卡（觀看、讚、回覆、轉發、引用、分享、互動率）含相對上期的漲跌幅、每日觀看圖、最佳發文時段推薦、高曝光貼文
- **分析** — 橫跨**成效**與**內容**兩個分頁的 15+ 張圖表
- **貼文** — 可搜尋、可篩選的列表，點選後展開單篇詳細分析
- 多帳號支援，可隨時切換
- 可設定自動同步間隔
- 密碼保護（單一環境變數 `APP_PASSWORD`）
- 繁體中文 / English 介面

---

## 系統需求

- Node.js 20+
- pnpm
- PostgreSQL 資料庫

---

## 開發設定

### 1. 複製專案並安裝套件

```bash
git clone https://github.com/ridemountainpig/threads-analytics.git
cd threads-analytics
pnpm install
```

### 2. 設定環境變數

在專案根目錄建立 `.env.local`：

```env
APP_PASSWORD=你的儀表板密碼
DATABASE_URL=postgresql://...              # PostgreSQL 連線字串
TOKEN_ENCRYPTION_KEY=                      # openssl rand -hex 32
CRON_SECRET=                               # 選填，正式環境用來保護 /api/cron/sync
```

| 變數                   | 說明                                      | 產生方式               |
| ---------------------- | ----------------------------------------- | ---------------------- |
| `APP_PASSWORD`         | 登入儀表板的密碼                          | 自行設定任意字串       |
| `DATABASE_URL`         | PostgreSQL 連線字串                       | 由你的資料庫服務提供   |
| `TOKEN_ENCRYPTION_KEY` | 加密存放在資料庫中的 Threads Access Token | `openssl rand -hex 32` |
| `CRON_SECRET`          | 正式環境用來保護 `/api/cron/sync`         | 隨機 16 字以上字串     |

### 3. 執行資料庫 migration

```bash
npx prisma migrate dev --name init
```

### 4. 啟動開發伺服器

```bash
pnpm dev
```

開啟 [http://localhost:3000](http://localhost:3000)，用 `APP_PASSWORD` 登入。

### 5. 連接 Threads 帳號

1. 點擊側邊欄的**設定**
2. 點擊**新增 Threads 帳號**
3. 貼上你的 Threads Access Token（取得方式見下方）
4. 點擊**同步**，開始抓取貼文與洞察資料

### 常用指令

```bash
pnpm dev          # 啟動開發伺服器
pnpm build        # 建置正式版
pnpm start        # 執行資料庫 migration 並啟動正式伺服器
npx prisma studio # 開啟資料庫 GUI
npx prisma migrate dev --name <名稱>  # 建立新的 migration
```

## 取得 Threads Access Token

1. 前往 [developers.facebook.com](https://developers.facebook.com) 建立含有 **Threads** 產品的應用程式
2. 產生**Access Token**
3. 在儀表板中：**設定 → 新增 Threads 帳號 → 貼上 Token**

> Token 有效期限為 60 天。當 Token 在 30 天內到期時，設定頁面會顯示警示提醒你重新連接。

---

## 分析功能說明

### 總覽

| 區塊             | 顯示內容                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **數據卡**       | 所選時段的總觀看、讚、回覆、轉發、引用、分享與互動率。每張卡片下方顯示相較於前一個等長時段的 `+/−%` 漲跌幅。 |
| **最佳發文時段** | 以中位數觀看排名的前 2–3 個發文時段，並標示基於樣本數的可信度。                                              |
| **每日觀看**     | 每日觀看數，搭配 7 日滾動平均線與你的個人中位數基準線。                                                      |
| **高曝光貼文**   | 觀看數超過中位數的貼文，依倍數排序（例如 `3.2× 中位數`）。                                                   |

### 分析 — 成效分頁

| 圖表                | 顯示內容                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **整體成效**        | 每日觀看數、發文量與單篇平均觀看數整合在同一條時間軸。                                                                                    |
| **單篇品質地圖**    | 以觸及（觀看數）vs 互動率定位每篇貼文的散點圖，點的大小代表分享數。分為四個象限：高觸及高互動、低觸及高互動、高觸及低互動、低觸及低互動。 |
| **觀看到行動漏斗**  | 從總觀看轉換到各行動類型（讚、回覆、轉發、引用、分享）的轉換率。                                                                          |
| **最佳發文時間**    | 各小時的中位數觀看熱力圖。Tooltip 顯示樣本數與可信度等級。                                                                                |
| **互動率趨勢**      | 每日互動率（互動 ÷ 觀看）與 7 日平滑平均線。                                                                                              |
| **最佳星期**        | 依星期比較中位數觀看、互動率與發文數。                                                                                                    |
| **格式 × 長度矩陣** | 以 2D 熱力圖比較各種內容格式與貼文長度組合相對於你的中位數觸及的表現。                                                                    |
| **互動拆解趨勢**    | 每日讚、回覆、轉發、引用的堆疊趨勢圖。                                                                                                    |

### 分析 — 內容分頁

分頁頂端的統計指標：**發文穩定度**（有發文週數佔比）、**分享率**、**引用比例**（引用 ÷（引用 + 轉發））、以及**總貼文數**。

| 圖表               | 顯示內容                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| **發文活動**       | 顯示每天發文數量的日曆熱力圖。                                                                         |
| **內容類型成效**   | 依媒體類型（文字、圖片、影片、輪播、音訊）比較中位數觀看、互動率與分享率。樣本數不足的類型會自動淡化。 |
| **貼文長度分析**   | 依字數區間比較中位數觀看。Tooltip 含平均值、P75、命中率與可信度。                                      |
| **發文頻率與成效** | 分析每週發文量增加是否能提升觸及，或反而稀釋單篇品質。                                                 |
| **分享趨勢**       | 每日分享數的長期走勢。                                                                                 |
| **互動率最高**     | 以（讚 + 回覆 + 轉發 + 引用）÷ 觀看排名的高互動率貼文。                                                |
| **回覆率最高**     | 依回覆 ÷ 觀看排序，找出最能引發對話的貼文。                                                            |

### 貼文頁面

貼文列表支援：

- **排序** — 依日期、觀看數或按讚數排序
- **搜尋** — 全文搜尋貼文內容
- **媒體類型篩選** — 只顯示當前時段內實際存在的類型

點選任一貼文後，右側面板顯示：觀看數、互動率、相對中位數倍數、觀看百分位，以及各行動類型的互動拆解長條圖。

---

## 部署

### 自動同步行為

- **Docker、VPS、Railway 等長時間運行的環境** — 使用內建 scheduler，App 啟動時會自動依照設定的間隔同步資料。
- **Vercel** — 不支援常駐 process，請改用 Vercel Cron 定期呼叫 `/api/cron/sync`，並設定 `CRON_SECRET` 保護此端點。

### Docker

設定所有環境變數後執行：

```bash
docker build -t threads-analytics .
docker run -p 3000:3000 --env-file .env.local threads-analytics
```

Docker 映像檔在啟動時會自動執行 `prisma migrate deploy`。
