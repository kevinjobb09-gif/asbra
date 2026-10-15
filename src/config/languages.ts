/**
 * Språk som förklaringarna kan visas på.
 * Frågan och svarsalternativen visas alltid på provets språk.
 *
 * `dir: "rtl"` betyder att texten skrivs från höger till vänster.
 */
export type LanguageCode = "sv" | "en" | "ar" | "fa" | "prs" | "so" | "ti" | "fi";

export type Language = {
  code: LanguageCode;
  /** Språkets namn på språket självt, så att användaren känner igen det. */
  nativeName: string;
  /** Språkets namn på svenska. */
  swedishName: string;
  /** Värde för HTML-attributet lang. Dari har ingen egen tvåbokstavskod, därför fa-AF. */
  htmlLang: string;
  dir: "ltr" | "rtl";
};

export const languages: Record<LanguageCode, Language> = {
  sv: { code: "sv", nativeName: "Svenska", swedishName: "svenska", htmlLang: "sv", dir: "ltr" },
  en: { code: "en", nativeName: "English", swedishName: "engelska", htmlLang: "en", dir: "ltr" },
  ar: { code: "ar", nativeName: "العربية", swedishName: "arabiska", htmlLang: "ar", dir: "rtl" },
  fa: { code: "fa", nativeName: "فارسی", swedishName: "persiska", htmlLang: "fa", dir: "rtl" },
  prs: { code: "prs", nativeName: "دری", swedishName: "dari", htmlLang: "fa-AF", dir: "rtl" },
  so: { code: "so", nativeName: "Soomaali", swedishName: "somaliska", htmlLang: "so", dir: "ltr" },
  ti: { code: "ti", nativeName: "ትግርኛ", swedishName: "tigrinja", htmlLang: "ti", dir: "ltr" },
  fi: { code: "fi", nativeName: "Suomi", swedishName: "finska", htmlLang: "fi", dir: "ltr" },
};

export function isRtl(code: LanguageCode): boolean {
  return languages[code].dir === "rtl";
}
