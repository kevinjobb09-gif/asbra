"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { AnswerOption } from "@/components/AnswerOption";
import { Explanation } from "@/components/practice/Explanation";
import { useI18n } from "@/i18n/client";
import { optionState, type PracticeQuestion } from "@/lib/practice/session";

/** En delad fråga: man kan gissa, eller trycka "Visa rätt svar". */
export function RevealAnswer({ question }: { question: PracticeQuestion }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: t("share.question"), text: question.question, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      // Avbrutet av användaren.
    }
  }

  return (
    <div className="space-y-4">
      <div lang="sv" dir="ltr" className="space-y-2">
        {question.options.map((option, i) => (
          <AnswerOption
            key={i}
            index={i}
            text={option}
            state={optionState(i, selected, question.correct_index)}
            onSelect={() => setSelected(i)}
            disabled={answered}
          />
        ))}
      </div>
      {!answered ? (
        <button
          type="button"
          onClick={() => setSelected(question.correct_index)}
          className="w-full rounded-full border-2 border-line bg-surface px-5 py-3 font-bold"
        >
          {t("share.showAnswer")}
        </button>
      ) : (
        <Explanation question={question} />
      )}
      <button type="button" onClick={share} className="mx-auto flex items-center gap-2 text-sm font-semibold text-primary">
        <Share2 size={16} aria-hidden /> {t("share.question")}
      </button>
    </div>
  );
}
