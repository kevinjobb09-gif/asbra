"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import type { Chapter } from "@/config";
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
  const [onlyWrong, setOnlyWrong] = useState(true);
  const percent = Math.round(result.share * 100);
  const chapterTitle = (n: number) => chapters.find((c) => c.number === n)?.title ?? `Kapitel ${n}`;

  // Kapitel med lägst andel rätt först – de bör man plugga mer på.
  const weakest = result.byChapter
    .map((c) => ({ ...c, share: c.correct / c.total }))
    .filter((c) => c.share < 0.75)
    .sort((a, b) => a.share - b.share)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-muted">{timedOut ? "Tiden tog slut – provet lämnades in" : "Provet är inlämnat"}</p>
        <h1 className="mt-2 text-4xl font-extrabold">
          {result.correct} av {result.total} rätt
        </h1>
        <p className="mt-1 text-2xl font-bold text-primary">{percent} %</p>
        {result.passed !== null ? (
          <p className="mt-3 text-lg font-bold">{result.passed ? "Du hade klarat gränsen för godkänt." : "Du hade inte nått gränsen för godkänt än."}</p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Gränsen för godkänt är inte officiellt fastställd. Se aktuell information hos{" "}
            <a href={officialInfoUrl} className="font-semibold text-primary underline" target="_blank" rel="noreferrer">
              UHR
            </a>
            .
          </p>
        )}
        <p className="mt-3 text-sm text-muted">
          Tid: {formatClock(usedSeconds * 1000)}
          {result.unanswered > 0 && ` · ${result.unanswered} obesvarade`}
        </p>
        {saveFailed && <p className="mt-2 text-sm text-muted">Resultatet kunde inte sparas i din historik.</p>}
      </section>

      {weakest.length > 0 && (
        <section className="rounded-2xl border-2 border-cta bg-cta-soft p-4">
          <h2 className="font-bold">Plugga mer på</h2>
          <ul className="mt-2 space-y-1">
            {weakest.map((c) => (
              <li key={c.chapter}>
                <a href={`/ova/kapitel/${c.chapter}`} className="font-semibold text-primary underline-offset-2 hover:underline">
                  {chapterTitle(c.chapter)}
                </a>{" "}
                – {c.correct} av {c.total} rätt
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold">Resultat per kapitel</h2>
        <ul className="mt-3 space-y-3">
          {result.byChapter.map((c) => {
            const share = Math.round((c.correct / c.total) * 100);
            return (
              <li key={c.chapter}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{chapterTitle(c.chapter)}</span>
                  <span className="text-muted">
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
          <h2 className="text-xl font-extrabold">Gå igenom frågorna</h2>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} className="size-4 accent-primary" />
            Visa bara fel
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
                      <span className="sr-only">{ok ? "Rätt" : "Fel"}</span>
                    </span>
                    <span className="font-semibold">
                      {i + 1}. {q.question}
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      Ditt svar:{" "}
                      <strong className={ok ? "text-correct" : "text-wrong"}>
                        {a === null ? "Inget svar" : `${LETTERS[a]}. ${q.options[a]}`}
                      </strong>
                    </p>
                    {!ok && (
                      <p>
                        Rätt svar:{" "}
                        <strong className="text-correct">
                          {LETTERS[q.correct_index]}. {q.options[q.correct_index]}
                        </strong>
                      </p>
                    )}
                    <p className="rounded-xl bg-primary-soft p-3">{q.explanation}</p>
                    <p className="text-muted">Läs mer: {q.source_reference}</p>
                  </div>
                </details>
              </li>
            );
          })}
          {onlyWrong && result.correct === result.total && <li className="text-muted">Inga fel – snyggt!</li>}
        </ol>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark"
        >
          Gör ett nytt prov
        </button>
        <ButtonLink href="/ova" variant="outline" className="flex-1">
          Öva per kapitel
        </ButtonLink>
      </div>
    </div>
  );
}
