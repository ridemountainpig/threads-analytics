# 桌面版技術筆記

繁體中文 | [English](./technical-notes.md) | [日本語](./technical-notes-ja.md)

[返回桌面版 README](../README-zh.md)

## 架構

桌面版透過 Native SDK 的系統 WebView，重用此儲存庫的 Next.js 應用程式。Zig 外殼會啟動位於 `127.0.0.1:43127` 的本機 Next.js standalone 伺服器。桌面版透過 Prisma 與 `better-sqlite3` 將資料儲存在 SQLite；託管的網頁版則繼續使用 PostgreSQL。

桌面版沒有登入密碼或登出操作。

## 儲存庫結構

```text
desktop/
├── app.json
├── build.zig
├── build.zig.zon
├── assets/
├── src/                    # Native SDK 生命週期與 WebView 外殼
├── runtime/                # SQLite 轉接器、遷移與伺服器啟動器
├── scripts/                # Next.js 開發、暫存與封裝流程
└── tests/
```

`desktop/dist`、`desktop/zig-out` 與 `desktop/runtime/generated` 下產生的檔案會刻意被忽略。每次建置桌面版網頁前，桌面版圖示都會從 `public/threads-analytics-icon.png` 同步。

## 執行階段與安全性

Threads Access Token 會經過加密。開發環境會將金鑰儲存在 `desktop/runtime`；封裝後的版本則會在應用程式資料目錄中建立權限模式為 `0600` 的金鑰。

開發環境使用 `desktop/runtime/dev.db`。封裝後的啟動器預設使用 `~/Library/Application Support/Threads Analytics/threads-analytics.db`。

設定 `THREADS_ANALYTICS_DATA_DIR` 可覆寫應用程式資料目錄。從自訂位置測試已暫存的執行階段時，請設定 `THREADS_ANALYTICS_SERVER_DIR`、`THREADS_ANALYTICS_NODE_PATH` 或 `THREADS_ANALYTICS_LAUNCHER_PATH`。

## 建置與封裝

`pnpm desktop:build:web` 會產生 SQLite Prisma client、以 `THREADS_ANALYTICS_TARGET=desktop` 建置根目錄的 Next.js 應用程式，並將 standalone 伺服器、公開資產、靜態檔案、遷移檔案與本機伺服器啟動器暫存至 `desktop/dist`。

`pnpm desktop:package:macos` 會嵌入建置時使用的 Node 執行檔，因此產生的 `.app` 不需要全域安裝 Node。Native SDK 封裝網頁執行階段後，指令碼會還原必要的符號連結、將 Node 暫存於資產清單之外，並以臨時簽章簽署原生附加元件、Node、外殼執行檔與最終 app bundle。

封裝前會先確認目前的 Node 版本符合 `.nvmrc`，並驗證 `better-sqlite3` 可使用相同的 Node ABI 載入。`pnpm desktop:package:macos` 與 `zig build package` 都會使用這一份封裝實作。

每個發行版本都應在目標架構上建置。

## 發行

桌面版由 GitHub Actions 的 **Release Desktop (macOS)** workflow（`.github/workflows/release-desktop.yml`）手動觸發發佈。請在要發行的分支或 commit 上執行，並輸入版本號，例如 `0.1.0-beta.1`。

Native SDK manifest 只接受純 `X.Y.Z` 版本號，因此 pre-release 後綴只會出現在 tag 與檔名中。workflow 會檢查 `X.Y.Z` 前綴同時符合 `desktop/app.json` 與 `package.json`，在 Apple silicon runner 上建置 app，壓縮為 `Threads-Analytics-<version>-macos-arm64.zip` 並附上 SHA-256 檔案，然後建立 `v<version>` tag 與 GitHub Release。帶後綴的版本一律標記為 pre-release；純版本號則依 workflow 的 pre-release 輸入決定。

發行版本採臨時簽章且未經 Apple 公證，自動產生的 release notes 會註明這點並連結到安裝說明。

workflow 也會透過 `THREADS_ANALYTICS_DESKTOP_VERSION` 把完整的發行版本號傳給建置流程。`desktop/scripts/build-next.mjs` 會將它以 `NEXT_PUBLIC_DESKTOP_APP_VERSION` 烘入 app（本機封裝則退回 manifest 的版本號），執行中的 app 會拿它與最新且附有 `-macos-arm64.zip` 資產的 GitHub Release 比較。正式版建置只會收到正式版的提示，也就是純 `X.Y.Z` 版本號、且沒有標記為 pre-release 的版本。beta 建置（例如 `0.1.0-beta.1`）還會收到帶有 pre-release 後綴的較新版本，所以 beta 使用者會知道有新的 beta，直到正式版發布後回到正式版。仍標記為 pre-release 的純版本號不會提示任何人。workflow 預設會把純版本號也標記為 pre-release，所以要在發布時（或之後編輯 release）取消勾選，已安裝的 app 才會收到這個正式版。有新版本時會在儀表板顯示 banner，並在「設定」→「關於」中顯示，兩處都會直接連到該版本的 ZIP。下載交給系統瀏覽器而不是 app 本身，因此 macOS 會照常標記隔離屬性，新版第一次開啟時仍會經過 Gatekeeper 檢查。只有本 repo 的 release 下載網址才會顯示下載連結，這個範圍已涵蓋在 `desktop/app.json` 的 `external_links` 允許清單內。開發版建置沒有烘入版本號，因此會略過檢查。

桌面版的 Next build 會設定 `experimental.isrFlushToDisk: false`，讓 fetch / ISR 快取只保留在記憶體中。否則 standalone server 第一次使用時會把 `.next/cache` 寫進已簽章的 `.app` bundle，導致簽章失效。

## Native SDK 指令

請在儲存庫根目錄執行：

```bash
pnpm exec native doctor --manifest desktop/app.json # 檢查主機環境、WebView 與 manifest 設定
pnpm exec native validate desktop/app.json          # 依 manifest schema 驗證 app.json
pnpm exec native dev desktop --yes                  # 搭配前端開發伺服器建置並執行 Debug app
pnpm exec native build desktop --yes                # 在 desktop/zig-out/bin 建置 ReleaseFast 執行檔
```
