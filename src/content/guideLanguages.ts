import type { LanguageCode } from "@/config";

/** Språk som guiden om medborgarskapsprovet finns på. Texterna ligger i guide.ts. */
export const GUIDE_LANGUAGES: LanguageCode[] = ["sv", "en", "ar", "fa", "so", "ti", "ckb"];

export function hasGuide(lang: LanguageCode): boolean {
  return GUIDE_LANGUAGES.includes(lang);
}

export const guidePath = (lang: LanguageCode) => (lang === "sv" ? "/guide" : `/${lang}/guide`);
