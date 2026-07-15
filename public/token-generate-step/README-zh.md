# 如何生成 Threads Access Token

繁體中文 | [English](./README.md) | [日本語](./README-ja.md)

本指南以 18 個步驟搭配對應截圖，一步一步說明如何從 Meta Developers 建立 App、加入 Threads API use case、邀請 Threads Tester，並產生可用於 Threads Analytics 的 Threads Access Token。

開始前請先準備：

- 一個可登入 [Meta for Developers](https://developers.facebook.com/apps/) 的 Facebook / Meta 帳號
- 一個公開的 Threads 帳號
- Threads 帳號與 Meta Developers 帳號可互相完成測試者邀請

> 這個流程適合個人或測試用途。若要讓非測試者使用，通常還需要完成 App Review 與發布流程。

## Step 1: 前往 Meta Developers 並建立 App

開啟 [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)，在 **Apps** 頁面右上角點擊 **Create App**。

![Step 1](./step-1.png)

## Step 2: 填寫 App 基本資料

在 **Create an app** 頁面輸入：

- **App name**: 例如 `Threads Analytics`
- **App contact email**: 你的聯絡信箱

確認後點擊 **Next**。

![Step 2](./step-2.png)

## Step 3: 選擇 Threads API use case

在 **Add use cases** 頁面找到 **Access the Threads API**，勾選右側方框，然後點擊 **Next**。

![Step 3](./step-3.png)

## Step 4: 不連接 business portfolio

在 business portfolio 步驟選擇 **I don't want to connect a business portfolio yet.**，再點擊 **Next**。

![Step 4](./step-4.png)

## Step 5: 確認發布需求

畫面顯示 **No requirements identified** 時，代表目前沒有額外需求。點擊 **Next**。

![Step 5](./step-5.png)

## Step 6: 建立 App

在 **Overview** 頁面確認 App 名稱、信箱、Use case、Business 與 Requirements 都正確後，點擊右下角 **Create app**。

![Step 6](./step-6.png)

## Step 7: 進入 Use cases

App 建立完成後會進入 Dashboard。從左側選單點擊 **Use cases**。

![Step 7](./step-7.png)

## Step 8: 自訂 Threads API use case

在 **Use cases** 頁面找到 **Access the Threads API**，點擊右側 **Customize**。

![Step 8](./step-8.png)

## Step 9: 進入 Settings

進入 **Customize use case** 後，左側會看到 **Permissions and features** 與 **Settings**。點擊 **Settings**。

![Step 9](./step-9.png)

## Step 10: 開啟 Threads Tester 管理

在 **Settings** 頁面下方找到 **User Token Generator**，點擊 **Add or Remove Threads Testers**。

這裡也可以看到：

- **Threads app ID**
- **Threads app secret**
- **Threads Display Name**
- **User Token Generator**

![Step 10](./step-10.png)

## Step 11: 新增測試人員

系統會進入 **App roles** 頁面。點擊右上角 **Add People**。

![Step 11](./step-11.png)

## Step 12: 指派 Threads Tester 角色

在 **Add people to your app** 視窗中：

1. 選擇 **Threads Tester**
2. 搜尋並選取要產生 token 的 Threads 帳號
3. 點擊 **Add**

> 受邀帳號必須是公開 Threads 帳號，並且需要在 Threads 端接受邀請。如果搜尋不到帳號，請確認該使用者有 Meta/Facebook Developer 帳號，且 Threads profile 已設為公開。

![Step 12](./step-12.png)

## Step 13: 到 Threads 設定查看網站權限

使用受邀的 Threads 帳號開啟 Threads 網頁版，進入 **More settings**，再點擊 **Website permissions**。

![Step 13](./step-13.png)

## Step 14: 接受測試者邀請

在 **Website permissions** 的 **Invites** 分頁中，找到剛建立的 App，例如 **Threads Analytics**，點擊 **Accept**。

![Step 14](./step-14.png)

## Step 15: 回到 Threads API Settings

接受邀請後，回到 Meta Developers 的 App 頁面，進入 **Use cases** → **Access the Threads API** → **Customize**，再點擊左側 **Settings**。

![Step 15](./step-15.png)

## Step 16: 產生 Access Token

在 **User Token Generator** 區塊中，找到剛接受邀請的 Threads Tester，點擊右側 **Generate Access Token**。

![Step 16](./step-16.png)

## Step 17: 確認授權

授權頁會列出 App 將取得的 Threads 權限。確認帳號正確後，點擊 **Continue As ...**。如果點擊 **Edit access**，請不要關閉 Threads Analytics 需要的資料或 insights 權限，否則 token 可能無法同步分析資料。

![Step 17](./step-17.png)

## Step 18: 複製 Access Token

回到 Meta Developers 後會出現 token 視窗。勾選 **I understand**，再點擊 **Copy** 複製產生的 long-lived Threads Access Token。

![Step 18](./step-18.png)

將 token 貼到 Threads Analytics 的 **Settings** → **Add Threads account** 即可開始同步資料。

> Threads Access Token 會過期。若同步失敗或接近到期，請依照同樣流程重新產生 token。
