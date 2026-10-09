# デスクトップ版技術ノート

[繁體中文](./technical-notes-zh.md) | [English](./technical-notes.md) | 日本語

[デスクトップ版 README に戻る](../README-ja.md)

## アーキテクチャ

デスクトップ版では、リポジトリの Next.js アプリケーションを Native SDK のシステム WebView 内で再利用します。Zig シェルが `127.0.0.1:43127` でローカルの Next.js standalone サーバーを起動します。デスクトップ版のデータは Prisma と `better-sqlite3` を介して SQLite に保存され、ホスト型の Web 版では引き続き PostgreSQL を使用します。

デスクトップ版にはログインパスワードやサインアウト操作がありません。

## リポジトリ構成

```text
desktop/
├── app.json
├── build.zig
├── build.zig.zon
├── assets/
├── src/                    # Native SDK のライフサイクルと WebView シェル
├── runtime/                # SQLite アダプター、マイグレーション、サーバーランチャー
├── scripts/                # Next.js の開発、ステージング、パッケージング
└── tests/
```

`desktop/dist`、`desktop/zig-out`、`desktop/runtime/generated` 以下の生成ファイルは意図的に無視されます。デスクトップ版のアイコンは、デスクトップ Web ビルドのたびに `public/threads-analytics-icon.png` から同期されます。

## ランタイムとセキュリティ

Threads アクセストークンは暗号化されます。開発環境では鍵を `desktop/runtime` に保存し、パッケージ版ではアプリケーションデータディレクトリにパーミッションモード `0600` の鍵を作成します。

開発環境では `desktop/runtime/dev.db` を使用します。パッケージ版のランチャーはデフォルトで `~/Library/Application Support/Threads Analytics/threads-analytics.db` を使用します。

アプリケーションデータディレクトリを変更するには、`THREADS_ANALYTICS_DATA_DIR` を設定します。カスタムの場所からステージング済みランタイムをテストする場合は、`THREADS_ANALYTICS_SERVER_DIR`、`THREADS_ANALYTICS_NODE_PATH`、または `THREADS_ANALYTICS_LAUNCHER_PATH` を設定してください。

## ビルドとパッケージング

`pnpm desktop:build:web` は SQLite 用 Prisma Client を生成し、`THREADS_ANALYTICS_TARGET=desktop` を指定してルートの Next.js アプリケーションをビルドします。その後、standalone サーバー、公開アセット、静的ファイル、マイグレーション、ローカルサーバーランチャーを `desktop/dist` に配置します。

`pnpm desktop:package:macos` はビルドに使用した Node 実行ファイルを埋め込むため、生成される `.app` では Node をグローバルにインストールする必要がありません。Native SDK が Web ランタイムをバンドルした後、スクリプトは必要なシンボリックリンクを復元し、Node をアセットマニフェスト外に配置して、ネイティブアドオン、Node、シェル実行ファイル、最終 app bundle に署名します。`MACOS_SIGNING_IDENTITY` に Developer ID Application の ID を設定すると、公証用に hardened runtime とセキュアタイムスタンプ付きで署名し、hardened runtime 下で V8 が必要とする JIT の entitlements（`desktop/assets/node.entitlements`）を Node に付与します。設定しない場合はアドホック署名になり、ローカルと CI のテストビルドはこの方式です。

パッケージング前に、現在の Node バージョンが `.nvmrc` と一致し、`better-sqlite3` が同じ Node ABI で読み込めることを検証します。`pnpm desktop:package:macos` と `zig build package` は、どちらもこの単一のパッケージング実装を使用します。

各リリースは対象アーキテクチャ上でビルドしてください。

## リリース

デスクトップ版のリリースは GitHub Actions の **Release Desktop (macOS)** workflow（`.github/workflows/release-desktop.yml`）から手動で実行します。リリースするブランチまたはコミットで実行し、`0.1.0-beta.1` のようなバージョンを入力してください。

Native SDK manifest は `X.Y.Z` 形式のバージョンしか受け付けないため、プレリリースの接尾辞はタグとアセット名にのみ含まれます。workflow は `X.Y.Z` 部分が `desktop/app.json` と `package.json` の両方と一致することを確認し、Apple silicon runner でアプリをビルドして `Threads-Analytics-<version>-macos-arm64.zip` と SHA-256 ファイルを作成し、`v<version>` タグと GitHub Release を作成します。接尾辞付きのバージョンは常にプレリリースとして公開され、接尾辞のないバージョンは workflow の pre-release 入力に従います。

workflow はリポジトリの secrets から Developer ID 証明書を一時キーチェーンに読み込み、その ID でアプリをパッケージ化し、App Store Connect API キーで Apple の公証サービスに提出して、ZIP 化の前に公証チケットをステープルします。検証ステップでは、展開したアプリのステープル済みチケットと Gatekeeper の評価を確認します。必要な secrets は workflow ファイルの冒頭に記載しています。

workflow は完全なリリースバージョンを `THREADS_ANALYTICS_DESKTOP_VERSION` としてビルドに渡します。`desktop/scripts/build-next.mjs` はこれを `NEXT_PUBLIC_DESKTOP_APP_VERSION` としてアプリに埋め込み（ローカルパッケージでは manifest のバージョンにフォールバック）、実行中のアプリはこの値を `-macos-arm64.zip` アセットを含む最新の GitHub Release と比較します。正式版のビルドに通知されるのは正式リリースだけで、これは接尾辞のない `X.Y.Z` バージョンで、かつプレリリースとしてマークされていないリリースです。ベータビルド（例: `0.1.0-beta.1`）には、より新しい正式リリースが優先して通知されるため、次のバージョンのベータがすでに公開されていても正式版に戻ります。より新しい正式リリースがない場合は、プレリリース接尾辞の付いたより新しいバージョンが通知されます。リリース一覧の最初のページにそのビルドの系統のバージョンがない場合、「設定」→「このアプリについて」は最新版であるとは表示せず、確認できなかったと表示します。プレリリースとしてマークされたままの接尾辞のないバージョンは、誰にも通知されません。workflow は接尾辞のないバージョンもデフォルトでプレリリースとしてマークするため、公開時（または公開後にリリースを編集して）このチェックを外したときに初めて、正式リリースがインストール済みのアプリに届きます。新しいバージョンがあるとダッシュボードにバナーが表示され、「設定」→「このアプリについて」にも反映されます。どちらからもそのリリースの ZIP を直接ダウンロードできます。ダウンロードはアプリではなくシステムのブラウザで行うため、macOS は通常どおり隔離属性を付け、新しいアプリの初回起動時には Gatekeeper のチェックが行われます。ダウンロードリンクはこのリポジトリのリリースダウンロード URL の場合にのみ表示され、この範囲は `desktop/app.json` の `external_links` 許可リストに含まれています。開発ビルドにはバージョンが埋め込まれないため、チェックは行われません。

デスクトップ版の Next ビルドでは `experimental.isrFlushToDisk: false` を設定し、fetch / ISR キャッシュをメモリ内にとどめます。そうしないと standalone サーバーが初回利用時に署名済み `.app` バンドル内へ `.next/cache` を書き込み、コード署名が無効になります。

## Native SDK コマンド

リポジトリのルートで実行してください。

```bash
pnpm exec native doctor --manifest desktop/app.json # ホスト環境、WebView、manifest 設定を確認
pnpm exec native validate desktop/app.json          # manifest schema に基づいて app.json を検証
pnpm exec native dev desktop --yes                  # フロントエンド開発サーバーと Debug app をビルドして実行
pnpm exec native build desktop --yes                # ReleaseFast バイナリを desktop/zig-out/bin にビルド
```
