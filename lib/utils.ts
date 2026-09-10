import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Node and browser ICU join date/time with different space characters
// (U+2009/U+202F/U+00A0 vs U+0020), which breaks hydration of SSR-ed dates.
export function normalizeIntlSpaces(formatted: string) {
  return formatted.replace(/\p{Zs}/gu, " ");
}
