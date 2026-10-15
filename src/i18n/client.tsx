"use client";

import { createContext, useContext, useMemo } from "react";
import { languages, type LanguageCode } from "@/config";
import { sv, type Messages } from "./messages/sv";
import { createTranslator, type Translate } from "./translate";

type I18n = { lang: LanguageCode; dir: "ltr" | "rtl"; t: Translate };

const I18nContext = createContext<I18n | null>(null);

/** Gör språket och texterna tillgängliga för klientkomponenter. */
export function I18nProvider({
  lang,
  messages,
  children,
}: {
  lang: LanguageCode;
  messages: Messages;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ lang, dir: languages[lang].dir, t: createTranslator(messages) }), [lang, messages]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

const swedishFallback: I18n = { lang: "sv", dir: "ltr", t: createTranslator(sv) };

/** Språk och översättning. Utan I18nProvider (t.ex. i tester) används svenska. */
export function useI18n(): I18n {
  return useContext(I18nContext) ?? swedishFallback;
}
