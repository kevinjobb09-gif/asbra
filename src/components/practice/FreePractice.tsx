"use client";

import { useEffect, useState } from "react";
import { UnlockOffer } from "@/components/UnlockOffer";
import { useI18n } from "@/i18n/client";
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
  const { t } = useI18n();
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
    return <p className="py-16 text-center text-muted">{t("common.loading")}</p>;
  }

  if (state.status === "empty") {
    return <p className="py-16 text-center text-muted">{t("free.empty")}</p>;
  }

  if (state.status === "used-up") {
    return <UnlockOffer title={t("free.usedUpTitle")} intro={t("free.usedUpIntro")} />;
  }

  return (
    <PracticeSession
      questions={state.questions}
      chapterLabel={t("free.label")}
      preview={preview}
      mode="free"
      counter={{ offset: state.answeredBefore, total: Math.min(limit, state.answeredBefore + state.questions.length) }}
      renderFinished={({ correct, total }) => (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-muted">{t("free.done")}</p>
            <p className="mt-1 text-3xl font-extrabold">{t("session.score", { c: correct, t: total })}</p>
          </div>
          <UnlockOffer title={t("free.offerTitle")} intro={t("free.offerIntro")} />
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
