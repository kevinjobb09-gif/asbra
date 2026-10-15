"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { useI18n } from "@/i18n/client";
import { shuffle, type PracticeQuestion } from "@/lib/practice/session";
import { PracticeSession } from "./PracticeSession";

type Item = { question: PracticeQuestion; correctInRow: number };

/** Lista över frågor man svarat fel på, och ett pass för att öva på dem igen. */
export function ReviewPractice({ items, streakNeeded }: { items: Item[]; streakNeeded: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const [started, setStarted] = useState<PracticeQuestion[] | null>(null);

  if (started) {
    return (
      <PracticeSession
        questions={started}
        chapterLabel={t("review.title")}
        mode="review"
        renderFinished={({ correct, total }) => (
          <div className="rounded-3xl border border-line bg-surface p-6 text-center">
            <h2 className="text-3xl font-extrabold">{t("session.score", { c: correct, t: total })}</h2>
            <p className="mt-2 text-muted">{t("review.finishedNote", { n: streakNeeded })}</p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStarted(null);
                  router.refresh();
                }}
                className="w-full max-w-xs rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark"
              >
                {t("review.backToList")}
              </button>
              <ButtonLink href="/resultat" variant="outline" className="w-full max-w-xs">
                {t("session.myResults")}
              </ButtonLink>
            </div>
          </div>
        )}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-extrabold">{t("review.title")}</h1>
        <p className="mt-2 text-muted">{t("review.intro", { n: streakNeeded })}</p>
      </div>

      <button
        type="button"
        onClick={() => setStarted(shuffle(items.map((i) => i.question)))}
        className="w-full rounded-full bg-cta px-6 py-4 text-lg font-bold text-white hover:bg-cta-dark"
      >
        {t("review.practiceN", { n: items.length })}
      </button>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map(({ question, correctInRow }) => (
          <li key={question.id} className="flex items-start gap-3 p-3">
            <span className="flex-1" lang="sv" dir="ltr">
              {question.question}
            </span>
            <span
              className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
              title={t("review.inRow", { c: correctInRow, n: streakNeeded })}
              dir="ltr"
            >
              {correctInRow}/{streakNeeded}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
