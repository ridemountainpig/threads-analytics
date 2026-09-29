# Threads Analytics 桌面版

繁體中文 | [English](./README.md) | [日本語](./README-ja.md)

[回到專案 README](../README-zh.md)

Threads Analytics 桌面版將現有的網頁儀表板封裝成 macOS app。你的 Threads 資料會以 SQLite 儲存在本機 Mac 上，託管的網頁版則繼續使用 PostgreSQL。

## 下載與安裝

桌面版支援 macOS 11 或更新版本，以及配備 Apple Silicon（M1 或更新晶片）的 Mac。

- [下載最新 GitHub Release](https://github.com/ridemountainpig/threads-analytics/releases)
- [查看 macOS 安裝、更新與解除安裝指南](./docs/install-macos-zh.md)

## 與網頁版的差異

- **本機資料庫** — 資料以 SQLite 儲存在你的 Mac 上，不需要 PostgreSQL 或架設伺服器。
- **不需要密碼** — 沒有 `APP_PASSWORD` 登入，也沒有登出功能。
- **內建自動同步** — 同步排程器固定啟用，不需要設定 `SYNC_SCHEDULER_ENABLED`。
- **手動更新** — 有新版本時 app 會顯示通知，但需要自行下載並安裝。

## 開發

環境需求：

- 配備 Apple Silicon 的 Mac
- Node.js 24.21.0（固定於 `.nvmrc`；桌面版建置會內嵌這個版本的 runtime，與網頁版的 Node.js 20.9+ 不同）
- pnpm
- [Zig](https://ziglang.org/download/) 0.16.0 或更新版本，且可在 `PATH` 中找到
- Xcode Command Line Tools（`xcode-select --install`），封裝時需要 `codesign`

### 快速開始

請在儲存庫根目錄執行以下指令：

```bash
nvm use                                             # 使用 .nvmrc 固定的 Node.js 版本
pnpm install                                        # 安裝專案相依套件
pnpm exec native doctor --manifest desktop/app.json # 檢查桌面版開發環境
pnpm exec native dev desktop --yes                  # 以開發模式建置並執行 app
```

### 常用指令

```bash
pnpm desktop:typecheck      # 檢查桌面版 adapter 的型別
pnpm desktop:test           # 執行桌面版測試套件
pnpm desktop:dev:web        # 啟動桌面版 Next.js 開發伺服器
pnpm desktop:build:web      # 建置 Next.js 執行階段並暫存至 desktop/dist
pnpm desktop:package:check  # 驗證固定的 Node runtime 與原生 SQLite ABI
pnpm desktop:package:macos  # 建置並封裝經臨時簽署的 macOS app bundle
pnpm desktop:open:macos     # 開啟封裝後的 app
```

封裝後的 app 會輸出至 `desktop/zig-out/package/Threads-Analytics.app`。

### 資料位置

| 環境         | 資料庫                                                                 | Token 加密金鑰                                                          |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 開發環境     | `desktop/runtime/dev.db`                                               | `desktop/runtime/.dev-token-encryption-key`                             |
| 封裝後的 app | `~/Library/Application Support/Threads Analytics/threads-analytics.db` | `~/Library/Application Support/Threads Analytics/.token-encryption-key` |

資料庫與金鑰必須一起保存：刪除金鑰後，已儲存的 access token 將無法解密。

### Zig 建置步驟

原生外殼也提供 Zig 建置步驟。請在 `desktop/` 執行：

```bash
zig build dev     # 執行前端開發伺服器與原生外殼
zig build run     # 建置已暫存的前端並執行原生 app
zig build test    # 執行 Zig 測試套件
zig build package # 執行與 pnpm desktop:package:macos 相同的 macOS 封裝流程
```

架構、執行階段、安全性、封裝與發布細節請參閱[桌面版技術筆記](./docs/technical-notes-zh.md)。
