# Threads Analytics macOS インストールガイド

[繁體中文](./install-macos-zh.md) | [English](./install-macos.md) | 日本語

[デスクトップ版 README に戻る](../README-ja.md)

Threads Analytics デスクトップ版では、Threads のデータを Mac 内に保存します。Node.js、pnpm、PostgreSQL を別途インストールする必要はありません。

## 動作要件

- macOS 11 以降
- Apple Silicon 搭載 Mac（M1 以降）
- アカウント接続用の Threads アクセストークン

現在、Intel Mac（x86_64）版は提供していません。

## ダウンロードとインストール

1. [Threads Analytics Releases](https://github.com/ridemountainpig/threads-analytics/releases) を開き、macOS 用 ZIP が含まれる最新のリリースを選びます。ベータ版は **Pre-release** と表示され、**Latest** には含まれません。
2. **Assets** から、`Threads-Analytics-0.1.0-beta.1-macos-arm64.zip` のようにファイル名に `macos-arm64` を含む ZIP をダウンロードします。
3. Finder で ZIP を開きます。
4. **Threads Analytics** を「アプリケーション」フォルダへドラッグします。
5. 「アプリケーション」から **Threads Analytics** を開きます。

インストールファイルは、このプロジェクトの GitHub Releases からのみダウンロードしてください。

## 初回セットアップ

デスクトップ版にサインイン用パスワードはありません。App を開いた後、次の手順で設定します。

1. サイドバーの「設定」を選択します。
2. 「Threads アカウントを追加」を選択します。
3. Threads アクセストークンを貼り付けます。
4. 最初の同期が完了するまで待ちます。所要時間はアカウントの投稿数によって異なります。

アクセストークンをまだ取得していない場合は、[Threads アクセストークンの生成方法](../../public/token-generate-step/README-ja.md)を参照してください。

## Preview 版を初めて開く場合

正式リリースが Developer ID で署名され、Apple の公証を受けた後は、「アプリケーション」から通常どおり開けます。

GitHub Release に **Preview** または「未公証」と明記されている場合、macOS は初回起動をブロックし、App を検証できない旨のメッセージを表示します。このプロジェクトの GitHub Releases から入手したファイルであることを確認してから、次の操作を行います。

**macOS 15（Sequoia）以降**

1. 「アプリケーション」から **Threads Analytics** を一度開き、警告ダイアログを閉じます。
2. 「システム設定」→「プライバシーとセキュリティ」を開きます。
3. 「セキュリティ」セクションまでスクロールし、Threads Analytics がブロックされたというメッセージの横にある「このまま開く」を選択します。
4. パスワードまたは Touch ID で確認し、最後のダイアログで「開く」を選択します。

**macOS 14（Sonoma）以前**

1. Finder の「アプリケーション」フォルダで、Control キーを押しながら **Threads Analytics** をクリックします。
2. 「開く」を選択します。
3. 確認ダイアログでもう一度「開く」を選択します。

この操作は、同じバージョンを初めて開くときにのみ必要です。新しいバージョンにアップデートしたあとは、上記の手順をもう一度行ってください。

それでも開けない場合は、macOS のバージョンとエラー画面を、その Release または GitHub Issues で報告してください。出所不明のターミナルコマンドを実行して Gatekeeper を無効にしないでください。

<a id="updating"></a>

## App のアップデート

デスクトップ版は GitHub Releases に新しいバージョンがあるかを確認し、見つかるとダッシュボード上部に通知を表示します。通知の対象は正式リリースのみで、**Pre-release** と表示されたリリースでは通知されません。インストール済みのバージョンと更新状況は「設定」→「このアプリについて」でも確認できます。App 自体がアップデートをインストールすることはありません。アップデートするには、次の手順を行います。

1. 更新の通知または「設定」→「このアプリについて」で「ダウンロード」を選択すると、ブラウザで最新版の ZIP がダウンロードされます。[GitHub Releases](https://github.com/ridemountainpig/threads-analytics/releases) から直接ダウンロードすることもできます。
2. Threads Analytics を終了します。
3. ZIP を展開し、新しい App を「アプリケーション」へドラッグして、既存の App を置き換えます。

App をアップデートしても、同期済みのデータは削除されません。

## データの保存場所とアンインストール

デスクトップ版のデータベースと暗号化キーは、次の場所に保存されます。

```text
~/Library/Application Support/Threads Analytics/
```

App をアンインストールするには、Threads Analytics を終了し、「アプリケーション」内の App をゴミ箱へ移動します。

アカウント設定とすべての同期済みデータも完全に削除する場合は、Finder で「移動」→「フォルダへ移動」を選択し、上記のパスを入力して、`Threads Analytics` フォルダをゴミ箱へ移動します。この操作は取り消せません。

## よくある質問

### ダウンロードできる macOS ZIP が見つからない

そのリリースにはデスクトップ版が含まれていない可能性があります。Release の Assets を確認し、GitHub が自動生成する `Source code` ZIP はダウンロードしないでください。

### Intel Mac で使用できますか？

現在は使用できません。macOS Release は Apple Silicon のみに対応しています。

### アップデート後に再同期する必要がありますか？

通常は必要ありません。デスクトップデータは App 本体とは別に保存されるため、「アプリケーション」内の App を置き換えてもローカルデータベースは削除されません。
