"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { languages } from "@/config";
import { useI18n } from "@/i18n/client";
import type { PracticeQuestion } from "@/lib/practice/session";

/**
 * Förklaringen till en fråga. Visas på användarens språk om en översättning
 * finns, med en knapp för att se den svenska. Maskinöversättningar märks diskret.
 */
export function Explanation({ question, compact = false }: { question: PracticeQuestion; compact?: boolean }) {
  const { t, lang } = useI18n();
  const translation = lang !== "sv" ? question.translation : null;
  const [showSwedish, setShowSwedish] = useState(false);
  const showTranslated = translation && !showSwedish;
  const language = languages[showTranslated ? lang : "sv"];

  return (
    <div className={compact ? "space-y-2" : "rounded-2xl bg-primary-soft p-4"}>
      {!compact && <p className="font-bold">{t("session.explanation")}</p>}
      <p lang={language.htmlLang} dir={language.dir} className={compact ? "rounded-xl bg-primary-soft p-3" : "mt-1"}>
        {showTranslated ? translation.explanation : question.explanation}
      </p>
      {translation && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          {showTranslated && translation.status === "machine" && <span>{t("session.machineTranslated")}</span>}
          <button
            type="button"
            onClick={() => setShowSwedish((v) => !v)}
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            {showTranslated ? t("session.showSwedish") : t("session.showTranslation", { language: languages[lang].nativeName })}
          </button>
        </div>
      )}
      <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
        <BookOpen size={16} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          {t("session.readMore")}{" "}
          <span lang="sv" dir="ltr">
            {question.source_reference}
          </span>
        </span>
      </p>
    </div>
  );
}
