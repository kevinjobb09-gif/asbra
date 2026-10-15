import "server-only";
import { cookies, headers } from "next/headers";
import { isLanguageCode, languages, LANGUAGE_CODES, type LanguageCode } from "@/config";
import { loadMessages } from "./load";
import { createTranslator } from "./translate";

export const LANG_COOKIE = "lang";

/**
 * Väljer språk: språket användaren har valt (cookie), annars svenska.
 * Sajten är alltid på svenska tills besökaren själv väljer ett annat språk.
 */
export async function getLang(): Promise<LanguageCode> {
  const cookieLang = (await cookies()).get(LANG_COOKIE)?.value;
  return isLanguageCode(cookieLang) ? cookieLang : "sv";
}

/**
 * Har besökaren valt språk än? Om inte visas språkrutan, med telefonens språk
 * som förslag (t.ex. arabiska om telefonen är inställd på arabiska).
 */
export async function getLanguageChoice(): Promise<{ hasChosen: boolean; suggested: LanguageCode }> {
  const hasChosen = isLanguageCode((await cookies()).get(LANG_COOKIE)?.value);
  return { hasChosen, suggested: pickFromAcceptLanguage((await headers()).get("accept-language")) };
}

/** Hittar bästa språket i webbläsarens Accept-Language, t.ex. "ar-SY,ar;q=0.9,en;q=0.8". */
export function pickFromAcceptLanguage(header: string | null): LanguageCode {
  if (!header) return "sv";
  const wanted = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter((x) => x.tag && !Number.isNaN(x.q))
    .sort((a, b) => b.q - a.q);
  for (const { tag } of wanted) {
    // Dari skickas ofta som fa-AF.
    if (tag === "fa-af" || tag === "prs") return "prs";
    const base = tag.split("-")[0];
    const exact = LANGUAGE_CODES.find((c) => c === base);
    if (exact) return exact;
    // Kroatiska och serbiska visas på samma språk som bosniska.
    if (base === "hr" || base === "sr") return "bs";
    if (base === "fil") return "tl";
    if (base === "ku") return "kmr";
    if (base === "nb" || base === "no" || base === "da") return "sv";
  }
  return "sv";
}

/** Språk, riktning och översättningsfunktion för serverkomponenter. */
export async function getI18n(langOverride?: LanguageCode) {
  const lang = langOverride ?? (await getLang());
  const messages = await loadMessages(lang);
  return { lang, dir: languages[lang].dir, messages, t: createTranslator(messages) };
}
