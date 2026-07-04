# Threads アクセストークンの生成方法

[繁體中文](./README-zh.md) | [English](./README.md) | 日本語

このガイドでは、`step-1.png` から `step-18.png` までの画面に沿って、Meta Developers で App を作成し、Threads API の use case を追加し、Threads Tester を招待して、Threads Analytics で使う Threads アクセストークンを生成する手順を説明します。

始める前に、次のものを用意してください。

- [Meta for Developers](https://developers.facebook.com/apps/) にログインできる Facebook / Meta アカウント
- 公開設定の Threads アカウント
- テスター招待を承認できる Threads アカウント

> この手順は個人利用またはテスト用途を想定しています。テスター以外のユーザーに使わせる場合は、通常 App Review と公開手続きが必要です。

## Step 1: Meta Developers を開いて App を作成する

[https://developers.facebook.com/apps/](https://developers.facebook.com/apps/) を開き、**Apps** ページ右上の **Create App** をクリックします。

![Step 1](./step-1.png)

## Step 2: App の基本情報を入力する

**Create an app** ページで次を入力します。

- **App name**: 例 `Threads Analytics`
- **App contact email**: 連絡用メールアドレス

入力後、**Next** をクリックします。

![Step 2](./step-2.png)

## Step 3: Threads API の use case を選択する

**Add use cases** ページで **Access the Threads API** を探し、右側のチェックボックスを選択して **Next** をクリックします。

![Step 3](./step-3.png)

## Step 4: business portfolio の接続をスキップする

business portfolio の手順では **I don't want to connect a business portfolio yet.** を選択し、**Next** をクリックします。

![Step 4](./step-4.png)

## Step 5: 公開要件を確認する

**No requirements identified** と表示されていれば、この設定では追加要件はありません。**Next** をクリックします。

![Step 5](./step-5.png)

## Step 6: App を作成する

**Overview** ページで App 名、メールアドレス、use case、Business、Requirements を確認し、右下の **Create app** をクリックします。

![Step 6](./step-6.png)

## Step 7: Use cases を開く

App 作成後、Dashboard が表示されます。左側メニューの **Use cases** をクリックします。

![Step 7](./step-7.png)

## Step 8: Threads API use case をカスタマイズする

**Use cases** ページで **Access the Threads API** を見つけ、右側の **Customize** をクリックします。

![Step 8](./step-8.png)

## Step 9: Settings を開く

**Customize use case** に入ると、左側に **Permissions and features** と **Settings** が表示されます。**Settings** をクリックします。

![Step 9](./step-9.png)

## Step 10: Threads Tester の管理画面を開く

**Settings** ページ下部の **User Token Generator** を見つけ、**Add or Remove Threads Testers** をクリックします。

このページでは次の情報も確認できます。

- **Threads app ID**
- **Threads app secret**
- **Threads Display Name**
- **User Token Generator**

![Step 10](./step-10.png)

## Step 11: ユーザーを追加する

**App roles** ページに移動します。右上の **Add People** をクリックします。

![Step 11](./step-11.png)

## Step 12: Threads Tester ロールを割り当てる

**Add people to your app** ダイアログで次の操作を行います。

1. **Threads Tester** を選択する
2. トークンを生成したい Threads アカウントを検索して選択する
3. **Add** をクリックする

> 招待されるアカウントは公開 Threads アカウントである必要があります。また、Threads 側で招待を承認する必要があります。検索に表示されない場合は、そのユーザーが Meta/Facebook Developer アカウントを持っていること、Threads profile が公開設定であることを確認してください。

![Step 12](./step-12.png)

## Step 13: Threads の Website permissions を開く

招待された Threads アカウントで Threads Web 版を開き、**More settings** に移動して **Website permissions** をクリックします。

![Step 13](./step-13.png)

## Step 14: テスター招待を承認する

**Website permissions** の **Invites** タブで、作成した App、例 **Threads Analytics** を見つけ、**Accept** をクリックします。

![Step 14](./step-14.png)

## Step 15: Threads API Settings に戻る

招待を承認したら、Meta Developers の App 画面に戻ります。**Use cases** → **Access the Threads API** → **Customize** に移動し、左側の **Settings** をクリックします。

![Step 15](./step-15.png)

## Step 16: アクセストークンを生成する

**User Token Generator** で、招待を承認した Threads Tester を探し、右側の **Generate Access Token** をクリックします。

![Step 16](./step-16.png)

## Step 17: 認可を確認する

認可ページには、App が取得する Threads 権限が表示されます。アカウントが正しいことを確認し、**Continue As ...** をクリックします。**Edit access** を開く場合は、Threads Analytics に必要なデータまたは insights 権限を無効にしないでください。無効にすると token は生成できても分析データを同期できない可能性があります。

![Step 17](./step-17.png)

## Step 18: アクセストークンをコピーする

Meta Developers に戻ると token のダイアログが表示されます。**I understand** にチェックを入れ、**Copy** をクリックして生成された long-lived Threads Access Token をコピーします。

![Step 18](./step-18.png)

コピーした token を Threads Analytics の **Settings** → **Add Threads account** に貼り付けると、データ同期を開始できます。

> Threads Access Token には有効期限があります。同期に失敗する場合や期限が近い場合は、同じ手順で token を再生成してください。
