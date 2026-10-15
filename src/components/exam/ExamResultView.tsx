"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { Explanation } from "@/components/practice/Explanation";
import type { Chapter } from "@/config";
import { useI18n } from "@/i18n/client";
import type { ExamResult } from "@/lib/exam/exam";
import { formatClock } from "@/lib/exam/timer";
import type { PracticeQuestion } from "@/lib/practice/session";

type Props = {
  result: ExamResult;
  questions: PracticeQuestion[];
  answers: (number | null)[];
  chapters: Chapter[];
  usedSeconds: number;
  timedOut: boolean;
  officialInfoUrl: string;
  saveFailed: boolean;
  onRestart: () => void;
};

const LETTERS = "ABCD";

/** Resultatet visas först när provet är inlämnat. */
export function ExamResultView({
  result,
  questions,
  answers,
  chapters,
  usedSeconds,
  timedOut,
  officialInfoUrl,
  saveFailed,
  onRestart,
}: Props) {
  const { t } = useI18n();
  const [onlyWrong, setOnlyWrong] = useState(true);
  const percent = Math.round(result.share * 100);
  const chapterTitle = (n: number) => chapters.find((c) => c.number === n)?.title ?? `${n}`;

  // Kapitel med lägst andel rätt först – de bör man plugga mer på.
  const weakest = result.byChapter
    .map((c) => ({ ...c, share: c.correct / c.total }))
    .filter((c) => c.share < 0.75)
    .sort((a, b) => a.share - b.share)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-muted">{timedOut ? t("examResult.timedOut") : t("examResult.submitted")}</p>
        <h1 className="mt-2 text-4xl font-extrabold">{t("session.score", { c: result.correct, t: result.total })}</h1>
        <p className="mt-1 text-2xl font-bold text-primary" dir="ltr">
          {percent} %
        </p>
        {result.passed !== null ? (
          <p className="mt-3 text-lg font-bold">{result.passed ? t("examResult.passed") : t("examResult.notPassed")}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            <a href={officialInfoUrl} className="underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
              {t("examResult.thresholdUnknown")}
            </a>
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          {t("examResult.time", { time: formatClock(usedSeconds * 1000) })}
          {result.unanswered > 0 && ` · ${t("examResult.unanswered", { n: result.unanswered })}`}
        </p>
        {saveFailed && <p className="mt-2 text-sm text-muted">{t("examResult.saveFailed")}</p>}
      </section>

      {weakest.length > 0 && (
        <section className="rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <h2 className="font-bold">{t("examResult.studyMore")}</h2>
          <ul className="mt-2 space-y-1">
            {weakest.map((c) => (
              <li key={c.chapter}>
                <Link href={`/ova/kapitel/${c.chapter}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                  {chapterTitle(c.chapter)}
                </Link>{" "}
                – {t("examResult.chapterScore", { c: c.correct, t: c.total })}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold">{t("examResult.perChapter")}</h2>
        <ul className="mt-3 space-y-3">
          {result.byChapter.map((c) => {
            const share = Math.round((c.correct / c.total) * 100);
            return (
              <li key={c.chapter}>
                <div className="flex justify-between gap-2 text-sm">
                  <span className="font-semibold">{chapterTitle(c.chapter)}</span>
                  <span className="text-muted" dir="ltr">
                    {c.correct}/{c.total} ({share} %)
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">{t("examResult.reviewTitle")}</h2>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} className="size-4 accent-primary" />
            {t("examResult.onlyWrong")}
          </label>
        </div>
        <ol className="mt-3 space-y-2">
          {questions.map((q, i) => {
            const a = answers[i];
            const ok = a === q.correct_index;
            if (onlyWrong && ok) return null;
            return (
              <li key={q.id}>
                <details className="rounded-2xl border border-line bg-surface p-4">
                  <summary className="flex cursor-pointer list-none items-start gap-2">
                    <span
                      className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-white ${ok ? "bg-correct-line" : "bg-wrong-line"}`}
                    >
                      {ok ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                      <span className="sr-only">{ok ? t("examResult.right") : t("examResult.wrong")}</span>
                    </span>
                    <span className="font-semibold" lang="sv" dir="ltr">
                      {i + 1}. {q.question}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      {t("examResult.yourAnswer")}{" "}
                      <strong className={ok ? "text-correct" : "text-wrong"} lang="sv" dir="ltr">
                        {a === null ? t("examResult.noAnswer") : `${LETTERS[a]}. ${q.options[a]}`}
                      </strong>
                    </p>
                    {!ok && (
                      <p>
                        {t("examResult.correctAnswer")}{" "}
                        <strong className="text-correct" lang="sv" dir="ltr">
                          {LETTERS[q.correct_index]}. {q.options[q.correct_index]}
                        </strong>
                      </p>
                    )}
                    <Explanation question={q} compact />
                  </div>
                </details>
              </li>
            );
          })}
          {onlyWrong && result.correct === result.total && <li className="text-muted">{t("examResult.noMistakes")}</li>}
        </ol>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark"
        >
          {t("examResult.newExam")}
        </button>
        <ButtonLink href="/ova" variant="outline" className="flex-1">
          {t("examResult.practiceChapters")}
        </ButtonLink>
      </div>
    </div>
  );
}
