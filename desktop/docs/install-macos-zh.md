# Threads Analytics macOS 安裝指南

繁體中文 | [English](./install-macos.md) | [日本語](./install-macos-ja.md)

[返回桌面版 README](../README-zh.md)

Threads Analytics 桌面版會將 Threads 資料儲存在你的 Mac，不需要自行安裝 Node.js、pnpm 或 PostgreSQL。

## 系統需求

- macOS 11 或更新版本
- 配備 Apple Silicon 的 Mac（M1 或更新晶片）
- 可用來連接帳號的 Threads Access Token

目前沒有提供 Intel Mac（x86_64）版本。

## 下載與安裝

1. 前往 [Threads Analytics Releases](https://github.com/ridemountainpig/threads-analytics/releases)，選擇最新且附有 macOS ZIP 的版本。Beta 版會標示為 **Pre-release**，不會出現在 **Latest** 之下。
2. 在 **Assets** 下載檔名包含 `macos-arm64` 的 ZIP 檔，例如 `Threads-Analytics-0.1.0-beta.1-macos-arm64.zip`。
3. 在 Finder 中打開 ZIP 檔。
4. 將 **Threads Analytics** 拖曳到「應用程式」資料夾。
5. 從「應用程式」打開 **Threads Analytics**。

請只從本專案的 GitHub Releases 下載安裝檔。

## 第一次使用

桌面版不需要登入密碼。App 開啟後：

1. 點擊側邊欄的「設定」。
2. 點擊「新增 Threads 帳號」。
3. 貼上 Threads Access Token。
4. 等待第一次同步完成；所需時間會依貼文數量而不同。

尚未取得 Access Token 時，請參閱[如何生成 Threads Access Token](../../public/token-generate-step/README-zh.md)。

## 第一次開啟

發行版本都以 Developer ID 簽署並經過 Apple 公證。第一次開啟新下載的版本時，macOS 會詢問是否要打開這個從網路下載的 App，選擇「打開」即可。

如果 macOS 改為顯示無法驗證 Threads Analytics 不含惡意軟體，代表這份檔案來自公證之前發佈的版本，或不是從本專案的 GitHub Releases 下載。請將它移到垃圾桶，再從 GitHub Releases 下載最新版本。如果仍出現警告，請在該版本的 Release 或 GitHub Issues 回報 macOS 版本與錯誤畫面。不要使用來源不明的終端指令停用 Gatekeeper。

<a id="updating"></a>

## 更新 App

桌面版會檢查 GitHub Releases 是否有新版本，有的話會在儀表板頂端顯示提示（使用正式版時只有較新的正式版會觸發；使用 beta 版時，較新的 beta 版也會觸發）；你也可以在「設定」→「關於」查看目前版本與更新狀態。App 不會自行安裝更新，更新時：

1. 在更新提示或「設定」→「關於」選擇「下載」，瀏覽器會下載最新版的 ZIP；也可以直接從 [GitHub Releases](https://github.com/ridemountainpig/threads-analytics/releases) 下載。
2. 結束 Threads Analytics。
3. 解壓縮後，將新版拖入「應用程式」並選擇取代舊版。

更新 App 不會刪除已同步的資料。

## 資料位置與解除安裝

桌面版的資料庫與加密金鑰儲存在：

```text
~/Library/Application Support/Threads Analytics/
```

解除安裝 App 時，先結束 Threads Analytics，再將「應用程式」中的 App 移到垃圾桶。

如果也要永久刪除帳號設定與所有已同步資料，請在 Finder 選擇「前往」→「前往檔案夾」，輸入上方路徑，再將 `Threads Analytics` 資料夾移到垃圾桶。此操作無法復原。

## 常見問題

### 找不到可下載的 macOS ZIP

該版本可能尚未提供桌面版。請查看 Release 說明中的 Assets，不要下載 GitHub 自動產生的 `Source code` ZIP。

### Intel Mac 可以使用嗎？

目前不行。現階段的 macOS Release 僅支援 Apple Silicon。

### 更新後需要重新同步嗎？

通常不需要。桌面資料與 App 本身分開儲存，取代「應用程式」中的 App 不會移除本機資料庫。
