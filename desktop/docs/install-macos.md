# Threads Analytics macOS Installation Guide

[繁體中文](./install-macos-zh.md) | English | [日本語](./install-macos-ja.md)

[Back to the desktop README](../README.md)

Threads Analytics Desktop stores your Threads data on your Mac. You do not need to install Node.js, pnpm, or PostgreSQL.

## Requirements

- macOS 11 or later
- A Mac with Apple silicon (M1 or later)
- A Threads access token for connecting your account

An Intel Mac (x86_64) build is not currently available.

## Download and install

1. Open [Threads Analytics Releases](https://github.com/ridemountainpig/threads-analytics/releases) and pick the newest release that lists a macOS ZIP. Beta builds are marked **Pre-release** and do not appear under **Latest**.
2. Under **Assets**, download the ZIP whose name contains `macos-arm64`, such as `Threads-Analytics-0.1.0-beta.1-macos-arm64.zip`.
3. Open the ZIP in Finder.
4. Drag **Threads Analytics** into the Applications folder.
5. Open **Threads Analytics** from Applications.

Only download the app from this project's GitHub Releases.

## First-time setup

The desktop app does not require a sign-in password. After opening the app:

1. Select **Settings** in the sidebar.
2. Select **Add Threads account**.
3. Paste your Threads access token.
4. Wait for the first sync to finish. The time required depends on the number of posts in your account.

If you do not have an access token yet, see [How to generate a Threads access token](../../public/token-generate-step/README.md).

## Opening a Preview build for the first time

Once a production release is signed with a Developer ID and notarized by Apple, it can be opened normally from Applications.

If a GitHub Release is explicitly marked **Preview** or “not notarized,” macOS blocks its first launch with a message that the app could not be verified. After confirming that the app came from this project's GitHub Releases:

**macOS 15 (Sequoia) or later**

1. Open **Threads Analytics** from Applications once and close the warning dialog.
2. Open **System Settings** → **Privacy & Security**.
3. Scroll to the **Security** section, find the message about Threads Analytics being blocked, and select **Open Anyway**.
4. Confirm with your password or Touch ID, then select **Open** in the final dialog.

**macOS 14 (Sonoma) or earlier**

1. In the Applications folder, Control-click **Threads Analytics**.
2. Select **Open**.
3. Select **Open** again in the confirmation dialog.

This is only needed the first time you open a given version. After updating to a new version, repeat the steps above.

If the app still does not open, report the macOS version and a screenshot of the error on that Release or in GitHub Issues. Do not run terminal commands from an unknown source to disable Gatekeeper.

<a id="updating"></a>

## Update the app

The desktop app checks GitHub Releases for newer versions and shows a notice at the top of the dashboard when one is available. On an official release, only newer official releases trigger the notice. On a beta, newer betas do too. You can also see the installed version and update status under **Settings** → **About**. The app does not install updates itself. To update it:

1. Select **Download** in the update notice or under **Settings** → **About**. Your browser downloads the newest version's ZIP. You can also download it from [GitHub Releases](https://github.com/ridemountainpig/threads-analytics/releases).
2. Quit Threads Analytics.
3. Extract the ZIP, drag the new version into Applications, and choose to replace the existing app.

Updating the app does not delete previously synced data.

## Data location and uninstalling

The desktop database and encryption key are stored in:

```text
~/Library/Application Support/Threads Analytics/
```

To uninstall the app, quit Threads Analytics and move it from Applications to the Trash.

To also permanently delete account settings and all synced data, open Finder, choose **Go** → **Go to Folder**, enter the path above, and move the `Threads Analytics` folder to the Trash. This cannot be undone.

## Troubleshooting

### There is no macOS ZIP to download

That release may not include a desktop build. Check the Release Assets, and do not download the automatically generated `Source code` ZIP.

### Can I use an Intel Mac?

Not currently. The macOS Release supports Apple silicon only.

### Do I need to sync again after updating?

Usually not. Desktop data is stored separately from the app, so replacing the app in Applications does not remove the local database.
