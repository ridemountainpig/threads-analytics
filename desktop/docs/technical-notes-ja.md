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

`pnpm desktop:package:macos` はビルドに使用した Node 実行ファイルを埋め込むため、生成される `.app` では Node をグローバルにインストールする必要がありません。Native SDK が Web ランタイムをバンドルした後、スクリプトは必要なシンボリックリンクを復元し、Node をアセットマニフェスト外に配置して、バンドル内のすべての Mach-O ファイル（拡張子ではなくヘッダーで判定）、Node、最終 app bundle に署名します。`MACOS_SIGNING_IDENTITY` に Developer ID Application の ID を設定すると、公証用に hardened runtime とセキュアタイムスタンプ付きで署名し、`desktop/assets/node.entitlements` の `allow-jit` entitlement を Node に付与します。これがないと hardened runtime 下で V8 が起動時に異常終了します。設定しない場合はアドホック署名になり、ローカルと CI のテストビルドはこの方式です。

パッケージング前に、現在の Node バージョンが `.nvmrc` と一致し、`better-sqlite3` が同じ Node ABI で読み込めることを検証します。`pnpm desktop:package:macos` と `zig build package` は、どちらもこの単一のパッケージング実装を使用します。

各リリースは対象アーキテクチャ上でビルドしてください。

## リリース

リリースは GitHub Actions の **Release** workflow（`.github/workflows/release.yml`）から手動で実行します。Mac アプリとダッシュボードの Docker イメージを、同じコミットから同じバージョンとして公開します。`main` で実行し、`1.0.0` のような接尾辞のないバージョンを入力してください。

Native SDK の updater はバンドルのバージョンを比較し、バンドルにはプレリリースの接尾辞を含められないため、すべてのリリースで接尾辞のない `X.Y.Z` バージョンを使います。workflow はバージョンが `desktop/app.json` と `package.json` の両方と一致することを確認し、Apple silicon runner でアプリをビルドして `Threads-Analytics-<version>-macos-arm64.zip` と SHA-256 ファイルを作成し、`v<version>` タグと GitHub Release を作成します。すべてのリリースはプレリリースとして作成され、正式版に切り替えるまでインストール済みのアプリとウェブサイトのダウンロードページはこれを無視します。

バージョンを上げるときは `CHANGELOG.md` に `## X.Y.Z` セクションも追加します。PR タイトルの一覧ではなく、ユーザー向けの文章で書きます。リリースノートはこのセクション（`desktop/scripts/changelog-section.mjs` が読み取ります）から始まり、Mac アプリのインストールガイド、イメージの `docker pull` コマンド、折りたたまれたアセットとチェックサムの表が続きます。セクションがない、または空の場合は workflow がビルド前に失敗し、`pnpm desktop:test` も現在の `package.json` のバージョンにセクションがあることを確認します。`update_notes` 入力はアプリの更新ダイアログにだけ使われます。

アプリのビルドと並行して、workflow は `.github/workflows/docker-publish.yml`（リリースの合間に `main` を `latest` として公開する workflow）を呼び出し、Docker イメージをビルドします。リリース用のイメージにはバージョンが埋め込まれ、ダッシュボードには `sha-…` ではなくバージョンが表示されます。プッシュされるのは `sha-<short sha>` タグだけで、プッシュしたダイジェストをネイティブの amd64 と arm64 の runner でスモークテストします。アプリとイメージの両方が通ったら、workflow はそのイメージに `X.Y.Z` タグを付けてリリースを作成します。タグとイメージのバージョンがまだ存在しないことは最初に確認済みで、公開済みの `X.Y.Z` が動かされることはありません。ZIP と `ghcr.io/ridemountainpig/threads-analytics:X.Y.Z` でプレリリースをテストしたら、同じバージョンで **Promote Release**（`.github/workflows/promote.yml`）を実行します。再ビルドせずに `latest`・`X.Y`・`X`（0.x では `0` は付けません）を同じイメージに向け、リリースを Latest として公開します。最新の正式リリースより古いバージョンは拒否されるため、`latest` が古いバージョンに戻ることはありません。

workflow は `desktop-release` environment の secrets から Developer ID 証明書を一時キーチェーンに読み込み、その ID でアプリをパッケージ化し、sidecar と署名済みシェルの両方をスモークテスト（`pnpm desktop:smoke:macos --shell`）してから、App Store Connect API キーで Apple の公証サービスに提出して、ZIP 化の前に公証チケットをステープルします。検証ステップでは、展開したアプリのステープル済みチケットと Gatekeeper の評価に加えて、ZIP にアプリだけが含まれ、その bundle id が manifest と一致し、バージョンがリリースバージョンで、実行ファイルが arm64 であることを確認します。必要な secrets は workflow ファイルの冒頭に記載しています。`desktop-release` environment に置き、デプロイ対象ブランチを `main` に制限して、他のブランチの workflow から読めないようにしてください。

workflow はリリースバージョンを `THREADS_ANALYTICS_DESKTOP_VERSION` としてビルドに渡します。`desktop/scripts/build-next.mjs` はこれを `NEXT_PUBLIC_DESKTOP_APP_VERSION` としてアプリに埋め込み（ローカルパッケージでは manifest のバージョンにフォールバック）、実行中のアプリはこの値を `-macos-arm64.zip` アセットを含む最新の GitHub Release と比較します。正式版のビルドに通知されるのは正式リリースだけで、これは接尾辞のない `X.Y.Z` バージョンで、かつプレリリースとしてマークされていないリリースです。以前の `0.1.0-beta.N` リリースのビルドには、より新しい正式リリースが優先して通知され、それがない場合はプレリリース接尾辞の付いたより新しいバージョンが通知されます。リリース一覧の最初のページにそのビルドの系統のバージョンがない場合、「設定」→「このアプリについて」は最新版であるとは表示せず、確認できなかったと表示します。すべてのリリースはプレリリースとして作成されるため、Promote Release で公開したときに初めてインストール済みのアプリに届きます。新しいバージョンがあるとダッシュボードにバナーが表示され、「設定」→「このアプリについて」にも反映されます。開発ビルドにはバージョンが埋め込まれないため、チェックは行われません。

### アプリ内アップデート

アップデートのインストールは Native SDK の updater（`desktop/app.json` の `updates`）が行います。workflow の `publish` job が `desktop/scripts/sign-update-feed.mjs` で `native-update.json` に署名します。これは bundle id、バージョン、ターゲット、ZIP の URL・サイズ・SHA-256 を記載した、Ed25519 で署名されたペイロードです。この job は依存パッケージをインストールせず、アプリのコードも実行しない新しい runner で動くため、`NATIVE_UPDATE_PRIVATE_KEY` secret がそれらのコードと同じマシンに置かれることはなく、リリースを作成できる token を受け取るのもこの job だけです。`desktop/src/main.zig` の Zig テストで、アプリに組み込まれた検証器がこのスクリプトの出力を受け付けることを確認しています。

インストール済みのアプリは、GitHub が **Latest** としてマークしたリリースからフィードを読み込みます（`updates.feed_url`）。Promote Release は公開するバージョンを Latest に設定します。ダッシュボードのバナーと「設定」→「このアプリについて」には「インストール」ボタンが表示され、bridge（`native-sdk.command.invoke`、アプリ自身の origin にのみ許可）経由で `app.check-for-updates` コマンドを実行します。アプリメニューの **Check for Updates…** も同じ流れを実行します。updater はフィードの署名を検証し、ZIP をダウンロードしてサイズと SHA-256 を確認し、bundle id が同じでバージョンがフィードと一致するアプリが 1 つだけ含まれていること、そのコード署名がインストール済みアプリと同じ Developer ID チームのものであることを確認します。その後アプリを置き換えて再起動し、新しいアプリが開けない場合は元のアプリに戻します。アプリを置くフォルダは書き込み可能である必要があります。`check_on_start` はオフのため、updater が起動時に割り込むことはなく、代わりにバナーで新しいバージョンを知らせます。

bridge の呼び出しに失敗した場合、ボタンは ZIP のダウンロードに切り替わります。ダウンロードはアプリではなくシステムのブラウザで行うため、macOS は通常どおり隔離属性を付け、新しいアプリの初回起動時には Gatekeeper のチェックが行われます。ダウンロードリンクはこのリポジトリのリリースダウンロード URL の場合にのみ表示され、この範囲は `desktop/app.json` の `external_links` 許可リストに含まれています。

アップデート用の鍵は一度だけ作成します。`pnpm exec native update keygen --private-key <リポジトリ外のパス>` を実行すると、`updates.public_key` に設定する公開鍵が表示されます。`base64 -i <パス>` の出力を `desktop-release` environment の `NATIVE_UPDATE_PRIVATE_KEY` secret として保存し、鍵ファイルをオフラインでバックアップしてください。インストール済みのアプリはこの鍵で署名されたフィードしか受け付けないため、鍵を失うと手動アップデートしかできなくなります。

デスクトップ版の Next ビルドでは `experimental.isrFlushToDisk: false` を設定し、fetch / ISR キャッシュをメモリ内にとどめます。そうしないと standalone サーバーが初回利用時に署名済み `.app` バンドル内へ `.next/cache` を書き込み、コード署名が無効になります。

## Native SDK コマンド

リポジトリのルートで実行してください。

```bash
pnpm exec native doctor --manifest desktop/app.json # ホスト環境、WebView、manifest 設定を確認
pnpm exec native validate desktop/app.json          # manifest schema に基づいて app.json を検証
pnpm exec native dev desktop --yes                  # フロントエンド開発サーバーと Debug app をビルドして実行
pnpm exec native build desktop --yes                # ReleaseFast バイナリを desktop/zig-out/bin にビルド
```
