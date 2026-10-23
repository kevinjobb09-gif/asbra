import { LANGUAGE_CODES, type LanguageCode } from "@/config";

/**
 * Språkkoder för hreflang. Google förstår bara ISO 639-1 (plus land), så språk utan
 * tvåbokstavskod får närmaste giltiga kod: dari = persiska i Afghanistan, sorani = kurdiska
 * i Irak, kurmanji = kurdiska i Turkiet.
 */
const HREFLANG: Partial<Record<LanguageCode, string>> = {
  prs: "fa-AF",
  ckb: "ku-IQ",
  kmr: "ku-TR",
  zh: "zh-Hans",
};

export function hreflangFor(code: LanguageCode): string {
  return HREFLANG[code] ?? code;
}

/**
 * Alternativa språkversioner för metadata.alternates.languages.
 * `pathFor` ger sökvägen för ett språk (svenska ligger utan prefix). x-default = svenska.
 */
export function languageAlternates(pathFor: (lang: LanguageCode) => string, codes: readonly LanguageCode[] = LANGUAGE_CODES) {
  const entries = codes.map((c) => [hreflangFor(c), pathFor(c)] as const);
  return { ...Object.fromEntries(entries), "x-default": pathFor("sv") };
}

/** Startsidans sökväg per språk: / för svenska, /ar för arabiska osv. */
export const homePath = (lang: LanguageCode) => (lang === "sv" ? "/" : `/${lang}`);
