"use client";

import { useEffect, useState } from "react";
import { UnlockOffer } from "@/components/UnlockOffer";
import { freeQuestionsLeft, pickFreeQuestions } from "@/lib/practice/free";
import type { PracticeQuestion } from "@/lib/practice/session";
import { ensureUser, getBrowserClient } from "@/lib/supabase/client";
import { PracticeSession } from "./PracticeSession";

type Props = {
  pool: PracticeQuestion[];
  limit: number;
  /** Admin förhandsgranskar: utkast visas och inget sparas. */
  preview?: boolean;
};

type State =
  | { status: "loading" }
  | { status: "ready"; questions: PracticeQuestion[]; answeredBefore: number }
  | { status: "used-up" }
  | { status: "empty" };

/**
 * Gratisläget: upp till `limit` frågor från olika kapitel. Svaren sparas,
 * så att man fortsätter där man slutade och inte får samma gratisfrågor igen.
 */
export function FreePractice({ pool, limit, preview = false }: Props) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const answered = preview ? new Set<string>() : await loadAnsweredFreeQuestions();
      const left = freeQuestionsLeft(answered.size, limit);
      const questions = pickFreeQuestions(pool, answered, left);
      if (cancelled) return;
      if (left === 0) setState({ status: "used-up" });
      else if (questions.length === 0) setState({ status: answered.size > 0 ? "used-up" : "empty" });
      else setState({ status: "ready", questions, answeredBefore: answered.size });
    })();
    return () => {
      cancelled = true;
    };
  }, [pool, limit, preview]);

  if (state.status === "loading") {
    return <p className="py-16 text-center text-muted">Laddar frågor …</p>;
  }

  if (state.status === "empty") {
    return <p className="py-16 text-center text-muted">Gratisfrågorna kommer snart. Titta in igen om några dagar!</p>;
  }

  if (state.status === "used-up") {
    return (
      <UnlockOffer
        title="Du har använt dina gratisfrågor"
        intro="Bra jobbat! Fortsätt öva med alla frågor och gör ett riktigt provtest."
      />
    );
  }

  return (
    <PracticeSession
      questions={state.questions}
      chapterLabel="Gratisövning"
      preview={preview}
      mode="free"
      counter={{ offset: state.answeredBefore, total: Math.min(limit, state.answeredBefore + state.questions.length), label: "Fråga" }}
      renderFinished={({ correct, total }) => (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-muted">Gratisövning klar</p>
            <p className="mt-1 text-3xl font-extrabold">
              {correct} av {total} rätt
            </p>
          </div>
          <UnlockOffer
            title="Vill du klara provet?"
            intro="Du har provat gratis. Lås upp alla frågor, provsimuleringen och förklaringar på ditt språk."
          />
        </div>
      )}
    />
  );
}

/** Hämtar vilka gratisfrågor användaren redan har svarat på. */
async function loadAnsweredFreeQuestions(): Promise<Set<string>> {
  const userId = await ensureUser();
  if (!userId) return new Set();
  const { data, error } = await getBrowserClient().from("answers").select("question_id").eq("mode", "free");
  if (error) {
    console.error("Kunde inte hämta tidigare svar:", error.message);
    return new Set();
  }
  return new Set(data.map((r) => r.question_id as string));
}
