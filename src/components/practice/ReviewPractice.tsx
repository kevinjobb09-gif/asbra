"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink } from "@/components/ButtonLink";
import { shuffle, type PracticeQuestion } from "@/lib/practice/session";
import { PracticeSession } from "./PracticeSession";

type Item = { question: PracticeQuestion; correctInRow: number };

/** Lista över frågor man svarat fel på, och ett pass för att öva på dem igen. */
export function ReviewPractice({ items, streakNeeded }: { items: Item[]; streakNeeded: number }) {
  const router = useRouter();
  const [started, setStarted] = useState<PracticeQuestion[] | null>(null);

  if (started) {
    return (
      <PracticeSession
        questions={started}
        chapterLabel="Repetera fel"
        mode="review"
        renderFinished={({ correct, total }) => (
          <div className="rounded-3xl border border-line bg-surface p-6 text-center">
            <h2 className="text-3xl font-extrabold">
              {correct} av {total} rätt
            </h2>
            <p className="mt-2 text-muted">
              Frågor du har svarat rätt på {streakNeeded} gånger i rad försvinner från listan.
            </p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStarted(null);
                  router.refresh();
                }}
                className="w-full max-w-xs rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark"
              >
                Tillbaka till listan
              </button>
              <ButtonLink href="/resultat" variant="outline" className="w-full max-w-xs">
                Mina resultat
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
        <h1 className="text-3xl font-extrabold">Repetera fel</h1>
        <p className="mt-2 text-muted">
          Här är frågorna du har svarat fel på. En fråga försvinner från listan när du svarat rätt på den{" "}
          {streakNeeded} gånger i rad.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setStarted(shuffle(items.map((i) => i.question)))}
        className="w-full rounded-full bg-cta px-6 py-4 text-lg font-bold text-white hover:bg-cta-dark"
      >
        Öva på {items.length} {items.length === 1 ? "fråga" : "frågor"}
      </button>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {items.map(({ question, correctInRow }) => (
          <li key={question.id} className="flex items-start gap-3 p-3">
            <span className="flex-1">{question.question}</span>
            <span
              className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
              title={`${correctInRow} av ${streakNeeded} rätt i rad`}
            >
              {correctInRow}/{streakNeeded}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
