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

`pnpm desktop:package:macos` 會嵌入建置時使用的 Node 執行檔，因此產生的 `.app` 不需要全域安裝 Node。Native SDK 封裝網頁執行階段後，指令碼會還原必要的符號連結、將 Node 暫存於資產清單之外，並簽署 bundle 內所有 Mach-O 檔案（依檔頭判斷，而非副檔名）、Node 與最終 app bundle。將 `MACOS_SIGNING_IDENTITY` 設為 Developer ID Application 身分時，會以 hardened runtime 與安全時間戳記簽署以供公證，並為 Node 加上 `desktop/assets/node.entitlements` 中的 `allow-jit` entitlement，否則 V8 在 hardened runtime 下一啟動就會中止；未設定時則採臨時簽章，本機與 CI 測試建置都是這種方式。

封裝前會先確認目前的 Node 版本符合 `.nvmrc`，並驗證 `better-sqlite3` 可使用相同的 Node ABI 載入。`pnpm desktop:package:macos` 與 `zig build package` 都會使用這一份封裝實作。

每個發行版本都應在目標架構上建置。

## 發行

桌面版由 GitHub Actions 的 **Release Desktop (macOS)** workflow（`.github/workflows/release-desktop.yml`）手動觸發發佈。請在 `main` 上執行，並輸入純版本號，例如 `0.1.0`。

每個版本都使用純 `X.Y.Z` 版本號，因為 Native SDK updater 比較的是 bundle 版本，而 bundle 無法帶有 pre-release 後綴。workflow 會檢查版本號同時符合 `desktop/app.json` 與 `package.json`，在 Apple silicon runner 上建置 app，壓縮為 `Threads-Analytics-<version>-macos-arm64.zip` 並附上 SHA-256 檔案，然後建立 `v<version>` tag 與 GitHub Release。預覽版就是勾選 workflow 的 pre-release 輸入（預設勾選）發佈的版本。

workflow 會從 `desktop-release` environment 的 secrets 將 Developer ID 憑證匯入臨時鑰匙圈，以該身分封裝 app，對 sidecar 與已簽章的外殼各執行一次 smoke test（`pnpm desktop:smoke:macos --shell`），再用 App Store Connect API key 送交 Apple 公證服務，並在壓縮前 staple 公證票證。驗證步驟會檢查解壓後 app 的 staple 票證與 Gatekeeper 評估結果，並確認 ZIP 中只有這個 app，且其 bundle id 與 manifest 相同、版本為發行版本、執行檔為 arm64。所需的 secrets 列在 workflow 檔案開頭；請放在 `desktop-release` environment，並將其部署分支限制為 `main`，讓其他分支的 workflow 讀不到。

workflow 也會透過 `THREADS_ANALYTICS_DESKTOP_VERSION` 把發行版本號傳給建置流程。`desktop/scripts/build-next.mjs` 會將它以 `NEXT_PUBLIC_DESKTOP_APP_VERSION` 烘入 app（本機封裝則退回 manifest 的版本號），執行中的 app 會拿它與最新且附有 `-macos-arm64.zip` 資產的 GitHub Release 比較。正式版建置只會收到正式版的提示，也就是純 `X.Y.Z` 版本號、且沒有標記為 pre-release 的版本。先前 `0.1.0-beta.N` 版本的建置會優先收到較新的正式版；沒有較新的正式版時，才會收到帶有 pre-release 後綴的較新版本。如果第一頁的 release 中沒有這個建置所屬類型的版本，「設定」→「關於」會顯示無法檢查，而不是顯示已是最新版本。workflow 預設會把版本標記為 pre-release，所以要在發布時（或之後編輯 release）取消勾選，已安裝的 app 才會收到這個版本。有新版本時會在儀表板顯示 banner，並在「設定」→「關於」中顯示。開發版建置沒有烘入版本號，因此會略過檢查。

### App 內更新

更新由 Native SDK updater（`desktop/app.json` 的 `updates`）安裝。workflow 的第二個 job `publish` 會用 `desktop/scripts/sign-update-feed.mjs` 簽署 `native-update.json`：這是一份以 Ed25519 簽章的內容，記載 bundle id、版本、目標平台，以及 ZIP 的網址、大小與 SHA-256。這個 job 在全新的 runner 上執行，不安裝任何依賴套件，也不執行 app 的程式碼，因此 `NATIVE_UPDATE_PRIVATE_KEY` secret 不會和那些程式碼出現在同一台機器上，而且只有這個 job 拿得到可寫入的 token。`desktop/src/main.zig` 中的 Zig 測試會確認 app 內建的驗證器接受這支腳本的輸出。

已安裝的 app 會從 GitHub 標記為 **Latest** 的 release 讀取更新資訊（`updates.feed_url`），所以只有最新的版本才保留勾選 **Set as the latest release**。儀表板 banner 與「設定」→「關於」會提供「安裝」按鈕，透過 bridge（`native-sdk.command.invoke`，只允許 app 自己的 origin）執行 `app.check-for-updates` 指令；app 選單的 **Check for Updates…** 也會執行相同流程。updater 會驗證更新資訊的簽章、下載 ZIP 並檢查大小與 SHA-256、要求其中只有一個 bundle id 相同且版本與更新資訊一致的 app，並確認其程式碼簽章屬於已安裝 app 的 Developer ID team。接著替換 app 並重新開啟；新版無法開啟時會還原舊版。app 所在的資料夾必須可寫入。`check_on_start` 為關閉，updater 不會在啟動時打斷使用者，改由 banner 提示有新版本。

bridge 呼叫失敗時，按鈕會改為下載 ZIP。下載交給系統瀏覽器而不是 app 本身，因此 macOS 會照常標記隔離屬性，新版第一次開啟時仍會經過 Gatekeeper 檢查。只有本 repo 的 release 下載網址才會顯示下載連結，這個範圍已涵蓋在 `desktop/app.json` 的 `external_links` 允許清單內。

更新金鑰只需建立一次：執行 `pnpm exec native update keygen --private-key <repo 以外的路徑>`，它會印出要填入 `updates.public_key` 的公鑰。把 `base64 -i <路徑>` 的輸出存成 `desktop-release` environment 的 `NATIVE_UPDATE_PRIVATE_KEY` secret，並離線備份金鑰檔：已安裝的 app 只接受用它簽署的更新資訊，金鑰遺失後就只能手動更新。

桌面版的 Next build 會設定 `experimental.isrFlushToDisk: false`，讓 fetch / ISR 快取只保留在記憶體中。否則 standalone server 第一次使用時會把 `.next/cache` 寫進已簽章的 `.app` bundle，導致簽章失效。

## Native SDK 指令

請在儲存庫根目錄執行：

```bash
pnpm exec native doctor --manifest desktop/app.json # 檢查主機環境、WebView 與 manifest 設定
pnpm exec native validate desktop/app.json          # 依 manifest schema 驗證 app.json
pnpm exec native dev desktop --yes                  # 搭配前端開發伺服器建置並執行 Debug app
pnpm exec native build desktop --yes                # 在 desktop/zig-out/bin 建置 ReleaseFast 執行檔
```
