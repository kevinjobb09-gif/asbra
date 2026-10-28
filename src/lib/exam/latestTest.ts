import { getCountry, languages, type LanguageCode } from "@/config";

/**
 * Uppgifter om det senaste riktiga provtillfället till texterna, t.ex.
 * { date: "augusti 2026", total: 40, pass: 28, percent: 70 }. null om inget prov har hållits.
 */
export function latestTestValues(lang: LanguageCode) {
  const country = getCountry();
  const latest = country.exam.latestTest;
  if (!latest) return null;
  const date = new Intl.DateTimeFormat(languages[lang].htmlLang, {
    month: "long",
    year: "numeric",
    timeZone: country.timeZone,
  }).format(new Date(`${latest.date}T12:00:00Z`));
  return {
    date,
    total: latest.questionCount,
    pass: latest.passMark,
    percent: Math.round((latest.passMark / latest.questionCount) * 100),
  };
}
