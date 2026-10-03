# Threads Analytics デスクトップ版

[繁體中文](./README-zh.md) | [English](./README.md) | 日本語

[プロジェクトの README に戻る](../README-ja.md)

Threads Analytics デスクトップ版は、既存の Web ダッシュボードを macOS app としてパッケージ化したものです。Threads のデータは SQLite としてお使いの Mac にローカル保存され、ホスト型の Web 版では引き続き PostgreSQL を使用します。

## ダウンロードとインストール

デスクトップ版は、macOS 11 以降および Apple Silicon 搭載 Mac（M1 以降）に対応しています。

- [最新の GitHub Release をダウンロード](https://github.com/ridemountainpig/threads-analytics/releases)
- [macOS のインストール、アップデート、アンインストールガイド](./docs/install-macos-ja.md)

## Web 版との違い

- **ローカルデータベース** — データは Mac 上の SQLite に保存されます。PostgreSQL やサーバーの用意は不要です。
- **パスワードなし** — `APP_PASSWORD` によるサインインやサインアウト機能はありません。
- **自動同期を内蔵** — 同期スケジューラーは常に有効で、`SYNC_SCHEDULER_ENABLED` を設定する必要はありません。
- **手動アップデート** — 新しいリリースがあると app に通知が表示されますが、ダウンロードとインストールはご自身で行います。

## 開発

必要な環境：

- Apple Silicon 搭載 Mac
- Node.js 24.21.0（`.nvmrc` で固定。デスクトップ版のビルドはこのバージョンのランタイムを同梱するため、Web 版は Node.js 22.12+ または 24+ で動作します）
- pnpm
- [Zig](https://ziglang.org/download/) 0.16.0 以降（`PATH` から実行できること）
- Xcode Command Line Tools（`xcode-select --install`）。パッケージ化時の `codesign` に必要です

### クイックスタート

以下のコマンドをリポジトリのルートで実行してください。

```bash
nvm use                                             # .nvmrc で固定された Node.js バージョンを使用
pnpm install                                        # プロジェクトの依存関係をインストール
pnpm exec native doctor --manifest desktop/app.json # デスクトップ版の開発環境を確認
pnpm exec native dev desktop --yes                  # 開発モードで app をビルドして実行
```

### よく使うコマンド

```bash
pnpm desktop:typecheck      # デスクトップ版アダプターを型チェック
pnpm desktop:test           # デスクトップ版のテストスイートを実行
pnpm desktop:dev:web        # デスクトップ版 Next.js 開発サーバーを起動
pnpm desktop:build:web      # Next.js ランタイムをビルドして desktop/dist に配置
pnpm desktop:package:check  # 固定 Node ランタイムとネイティブ SQLite ABI を検証
pnpm desktop:package:macos  # アドホック署名済み macOS app bundle をビルドしてパッケージ化
pnpm desktop:open:macos     # パッケージ化された app を開く
```

パッケージ化された app は `desktop/zig-out/package/Threads Analytics.app` に出力されます。

### データの保存場所

| 環境         | データベース                                                           | トークン暗号化キー                                                      |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 開発環境     | `desktop/runtime/dev.db`                                               | `desktop/runtime/.dev-token-encryption-key`                             |
| パッケージ版 | `~/Library/Application Support/Threads Analytics/threads-analytics.db` | `~/Library/Application Support/Threads Analytics/.token-encryption-key` |

データベースとキーは必ずセットで保管してください。キーを削除すると、保存済みのアクセストークンを復号できなくなります。

### Zig ビルド手順

ネイティブシェルには Zig ビルド手順も用意されています。`desktop/` で実行してください。

```bash
zig build dev     # フロントエンド開発サーバーとネイティブシェルを実行
zig build run     # ステージング済みフロントエンドをビルドしてネイティブ app を実行
zig build test    # Zig テストスイートを実行
zig build package # pnpm desktop:package:macos と同じ macOS パッケージング処理を実行
```

アーキテクチャ、ランタイム、セキュリティ、パッケージング、リリースの詳細は、[デスクトップ版技術ノート](./docs/technical-notes-ja.md)を参照してください。
