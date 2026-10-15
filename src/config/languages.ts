/**
 * SPRÅK
 *
 * Gränssnittet och förklaringarna kan visas på alla språk nedan.
 * Frågan och svarsalternativen visas ALLTID på provets språk (svenska), som på provet.
 *
 * Urvalet bygger på vilka språk som är vanligast bland dem som söker svenskt
 * medborgarskap. Lägg till ett språk här och i src/i18n/messages/ för att utöka.
 *
 * `dir: "rtl"` betyder att texten skrivs från höger till vänster.
 */
export const LANGUAGE_CODES = [
  "sv",
  "en",
  "ar",
  "fa",
  "prs",
  "ps",
  "ckb",
  "kmr",
  "so",
  "ti",
  "am",
  "tr",
  "ru",
  "uk",
  "pl",
  "bs",
  "es",
  "fr",
  "th",
  "zh",
  "vi",
  "ur",
  "tl",
  "fi",
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

/** Vilket typsnitt språket behöver (se layout.tsx). */
export type Script = "latin" | "arabic" | "ethiopic" | "thai" | "cjk";

export type Language = {
  code: LanguageCode;
  /** Språkets namn på språket självt, så att användaren känner igen det. */
  nativeName: string;
  /** Språkets namn på svenska. */
  swedishName: string;
  /** Värde för HTML-attributet lang. */
  htmlLang: string;
  dir: "ltr" | "rtl";
  script: Script;
};

export const languages: Record<LanguageCode, Language> = {
  sv: { code: "sv", nativeName: "Svenska", swedishName: "svenska", htmlLang: "sv", dir: "ltr", script: "latin" },
  en: { code: "en", nativeName: "English", swedishName: "engelska", htmlLang: "en", dir: "ltr", script: "latin" },
  ar: { code: "ar", nativeName: "العربية", swedishName: "arabiska", htmlLang: "ar", dir: "rtl", script: "arabic" },
  fa: { code: "fa", nativeName: "فارسی", swedishName: "persiska", htmlLang: "fa", dir: "rtl", script: "arabic" },
  prs: { code: "prs", nativeName: "دری", swedishName: "dari", htmlLang: "fa-AF", dir: "rtl", script: "arabic" },
  ps: { code: "ps", nativeName: "پښتو", swedishName: "pashto", htmlLang: "ps", dir: "rtl", script: "arabic" },
  ckb: { code: "ckb", nativeName: "کوردیی ناوەندی", swedishName: "kurdiska (sorani)", htmlLang: "ckb", dir: "rtl", script: "arabic" },
  kmr: { code: "kmr", nativeName: "Kurmancî", swedishName: "kurdiska (kurmanji)", htmlLang: "kmr", dir: "ltr", script: "latin" },
  so: { code: "so", nativeName: "Soomaali", swedishName: "somaliska", htmlLang: "so", dir: "ltr", script: "latin" },
  ti: { code: "ti", nativeName: "ትግርኛ", swedishName: "tigrinja", htmlLang: "ti", dir: "ltr", script: "ethiopic" },
  am: { code: "am", nativeName: "አማርኛ", swedishName: "amhariska", htmlLang: "am", dir: "ltr", script: "ethiopic" },
  tr: { code: "tr", nativeName: "Türkçe", swedishName: "turkiska", htmlLang: "tr", dir: "ltr", script: "latin" },
  ru: { code: "ru", nativeName: "Русский", swedishName: "ryska", htmlLang: "ru", dir: "ltr", script: "latin" },
  uk: { code: "uk", nativeName: "Українська", swedishName: "ukrainska", htmlLang: "uk", dir: "ltr", script: "latin" },
  pl: { code: "pl", nativeName: "Polski", swedishName: "polska", htmlLang: "pl", dir: "ltr", script: "latin" },
  bs: { code: "bs", nativeName: "Bosanski / Hrvatski / Srpski", swedishName: "bosniska/kroatiska/serbiska", htmlLang: "bs", dir: "ltr", script: "latin" },
  es: { code: "es", nativeName: "Español", swedishName: "spanska", htmlLang: "es", dir: "ltr", script: "latin" },
  fr: { code: "fr", nativeName: "Français", swedishName: "franska", htmlLang: "fr", dir: "ltr", script: "latin" },
  th: { code: "th", nativeName: "ไทย", swedishName: "thailändska", htmlLang: "th", dir: "ltr", script: "thai" },
  zh: { code: "zh", nativeName: "中文（简体）", swedishName: "kinesiska", htmlLang: "zh-Hans", dir: "ltr", script: "cjk" },
  vi: { code: "vi", nativeName: "Tiếng Việt", swedishName: "vietnamesiska", htmlLang: "vi", dir: "ltr", script: "latin" },
  ur: { code: "ur", nativeName: "اردو", swedishName: "urdu", htmlLang: "ur", dir: "rtl", script: "arabic" },
  tl: { code: "tl", nativeName: "Tagalog", swedishName: "tagalog", htmlLang: "tl", dir: "ltr", script: "latin" },
  fi: { code: "fi", nativeName: "Suomi", swedishName: "finska", htmlLang: "fi", dir: "ltr", script: "latin" },
};

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function isRtl(code: LanguageCode): boolean {
  return languages[code].dir === "rtl";
}
