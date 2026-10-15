"use client";

import { useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { AnswerOption } from "@/components/AnswerOption";
import { ButtonLink } from "@/components/ButtonLink";
import {
  initSession,
  optionState,
  sessionReducer,
  shuffle,
  summarize,
  type PracticeQuestion,
} from "@/lib/practice/session";
import { ensureUser, getBrowserClient } from "@/lib/supabase/client";
import { ReportButton } from "./ReportButton";

type Props = {
  questions: PracticeQuestion[];
  chapterLabel: string;
  /** Admin förhandsgranskar utkast: inga svar sparas. */
  preview?: boolean;
  /** Sparas tillsammans med svaret. */
  mode?: "chapter" | "free" | "review";
  /** Räknare som fortsätter där man slutade, t.ex. "Gratisfråga 12 av 30". */
  counter?: { offset: number; total: number; label: string };
  /** Egen vy när passet är klart (t.ex. erbjudande efter gratisläget). */
  renderFinished?: (summary: { correct: number; total: number }) => React.ReactNode;
};

const LETTERS = "ABCD";

export function PracticeSession({
  questions,
  chapterLabel,
  preview = false,
  mode = "chapter",
  counter,
  renderFinished,
}: Props) {
  const [state, dispatch] = useReducer(sessionReducer, questions, initSession);
  const feedbackRef = useRef<HTMLDivElement>(null);

  // Skapa en anonym inloggning i förväg, så att första svaret sparas snabbt.
  useEffect(() => {
    if (!preview) void ensureUser();
  }, [preview]);

  const question = state.questions[state.index];

  function answer(selected: number) {
    if (state.selected !== null) return;
    dispatch({ type: "answer", selected });
    if (!preview) void saveAnswer(question, selected, mode);
    // Visa förklaringen på små skärmar.
    setTimeout(() => feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
  }

  if (state.finished) {
    const { correct, total } = summarize(state.results);
    if (renderFinished) return <>{renderFinished({ correct, total })}</>;
    return (
      <div className="rounded-3xl border border-line bg-surface p-6 text-center">
        <p className="text-sm font-semibold text-muted">{chapterLabel}</p>
        <h2 className="mt-2 text-3xl font-extrabold">
          {correct} av {total} rätt
        </h2>
        <p className="mt-2 text-muted">
          {total === 0
            ? "Det finns inga frågor här ännu."
            : correct === total
              ? "Perfekt! Du kan det här kapitlet."
              : "Bra jobbat! Öva igen för att bli ännu säkrare."}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          {total > 0 && (
            <button
              type="button"
              onClick={() => dispatch({ type: "restart", questions: shuffle(questions) })}
              className="w-full max-w-xs rounded-full bg-cta px-6 py-3 font-bold text-white hover:bg-cta-dark"
            >
              Öva igen
            </button>
          )}
          <ButtonLink href="/ova" variant="outline" className="w-full max-w-xs">
            Välj ett annat kapitel
          </ButtonLink>
          <ButtonLink href="/resultat" variant="outline" className="w-full max-w-xs">
            Mina resultat
          </ButtonLink>
        </div>
      </div>
    );
  }

  const answered = state.selected !== null;
  const isCorrect = answered && state.selected === question.correct_index;
  const done = state.index + (answered ? 1 : 0);
  const progress = counter
    ? ((counter.offset + done) / counter.total) * 100
    : (done / state.questions.length) * 100;

  return (
    <div className="space-y-5 pb-24">
      {/* Förlopp */}
      <div>
        <div className="flex items-center justify-between text-sm font-semibold text-muted">
          <span>{chapterLabel}</span>
          <span>
            {counter
              ? `${counter.label} ${counter.offset + state.index + 1} av ${counter.total}`
              : `Fråga ${state.index + 1} av ${state.questions.length}`}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Frågan – alltid på svenska, som på provet */}
      <h1 lang="sv" className="text-xl leading-snug font-bold sm:text-2xl">
        {question.question}
      </h1>

      <div className="space-y-2" role="group" aria-label="Svarsalternativ">
        {question.options.map((option, i) => (
          <AnswerOption
            key={i}
            index={i}
            text={option}
            state={optionState(i, state.selected, question.correct_index)}
            onSelect={() => answer(i)}
            disabled={answered}
          />
        ))}
      </div>

      {/* Rättning och förklaring */}
      {answered && (
        <div ref={feedbackRef} aria-live="polite" className="space-y-3">
          <p className={`text-lg font-extrabold ${isCorrect ? "text-correct" : "text-wrong"}`}>
            {isCorrect ? "Rätt! Bra jobbat." : `Inte rätt. Rätt svar är ${LETTERS[question.correct_index]}.`}
          </p>
          <div className="rounded-2xl bg-primary-soft p-4">
            <p className="font-bold">Förklaring</p>
            <p className="mt-1">{question.explanation}</p>
            <p className="mt-3 flex items-start gap-1.5 text-sm text-muted">
              <BookOpen size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>Läs mer: {question.source_reference}</span>
            </p>
          </div>
          <ReportButton key={question.id} questionId={question.id} disabled={preview} />
        </div>
      )}

      {/* Nästa-knapp fäst längst ner, lätt att nå med tummen */}
      {answered && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              autoFocus
              onClick={() => {
                dispatch({ type: "next" });
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full rounded-full bg-primary px-6 py-4 text-lg font-bold text-white hover:bg-primary-dark"
            >
              {state.index + 1 < state.questions.length ? "Nästa fråga" : "Se resultat"}
            </button>
          </div>
        </div>
      )}

      {!answered && mode === "chapter" && (
        <p className="text-center text-sm text-muted">
          <Link href="/ova" className="underline-offset-2 hover:underline">
            Byt kapitel
          </Link>
        </p>
      )}
    </div>
  );
}

/** Sparar svaret i databasen. Misslyckas det fortsätter övningen ändå. */
async function saveAnswer(question: PracticeQuestion, selected: number, mode: "chapter" | "free" | "review") {
  const userId = await ensureUser();
  if (!userId) return;
  const { error } = await getBrowserClient()
    .from("answers")
    .insert({
      question_id: question.id,
      selected_index: selected,
      is_correct: selected === question.correct_index,
      mode,
    });
  if (error) console.error("Kunde inte spara svaret:", error.message);
}
