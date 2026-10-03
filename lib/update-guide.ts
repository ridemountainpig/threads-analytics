import type { Locale } from "@/lib/i18n";
import { isDesktopApp } from "@/lib/runtime-target";

// The `#updating` anchor is an explicit <a id> in each README and desktop
// install guide, so the links survive section title changes.
export const UPDATE_GUIDE_URLS: Record<Locale, string> = {
  en: "https://github.com/ridemountainpig/threads-analytics#updating",
  "zh-TW": "https://github.com/ridemountainpig/threads-analytics/blob/main/README-zh.md#updating",
  ja: "https://github.com/ridemountainpig/threads-analytics/blob/main/README-ja.md#updating",
};

const DESKTOP_GUIDE_BASE =
  "https://github.com/ridemountainpig/threads-analytics/blob/main/desktop/docs";

export const DESKTOP_UPDATE_GUIDE_URLS: Record<Locale, string> = {
  en: `${DESKTOP_GUIDE_BASE}/install-macos.md#updating`,
  "zh-TW": `${DESKTOP_GUIDE_BASE}/install-macos-zh.md#updating`,
  ja: `${DESKTOP_GUIDE_BASE}/install-macos-ja.md#updating`,
};

// Web deployments update by pulling a new image; the desktop app by replacing
// the .app bundle. Each has its own guide.
export function updateGuideUrl(locale: Locale) {
  return isDesktopApp ? DESKTOP_UPDATE_GUIDE_URLS[locale] : UPDATE_GUIDE_URLS[locale];
}
