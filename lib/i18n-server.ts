import "server-only";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, dictionaries, isLocale, type Locale } from "@/lib/i18n";

export { dateLocales } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : "en";
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}
