"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, LayoutGrid } from "lucide-react";
import { AnswerOption } from "@/components/AnswerOption";
import type { Chapter } from "@/config";
import { gradeExam, pickExamQuestions, type ExamResult } from "@/lib/exam/exam";
import { formatClock, isTimeUp, remainingMs, timeWarning, usedSeconds } from "@/lib/exam/timer";
import type { PracticeQuestion } from "@/lib/practice/session";
import { ensureUser, getBrowserClient } from "@/lib/supabase/client";
import { ExamResultView } from "./ExamResultView";

type Props = {
  pool: PracticeQuestion[];
  questionCount: number;
  timeLimitSeconds: number;
  passThreshold: number | null;
  chapters: Chapter[];
  country: string;
  officialInfoUrl: string;
  /** Admin förhandsgranskar: inget sparas i databasen. */
  preview?: boolean;
};

/** Pågående prov som sparas i webbläsaren, så att en omladdning inte nollställer klockan. */
type Saved = {
  questionIds: string[];
  answers: (number | null)[];
  startedAt: number;
  deadline: number;
};

type Phase =
  | { name: "intro" }
  | { name: "running"; questions: PracticeQuestion[]; startedAt: number; deadline: number; resumed: boolean }
  | {
      name: "result";
      questions: PracticeQuestion[];
      answers: (number | null)[];
      result: ExamResult;
      usedSeconds: number;
      timedOut: boolean;
      saveFailed: boolean;
    };

const LETTERS = "ABCD";

/** Aktuell tid. Anropas bara vid klick, klockans tick och när sidan laddas – aldrig medan sidan ritas. */
const currentTime = () => Date.now();

export function ExamSession(props: Props) {
  const { pool, questionCount, timeLimitSeconds, passThreshold, chapters, country, officialInfoUrl, preview = false } = props;
  const storageKey = `${country}:prov:v1${preview ? ":preview" : ""}`;

  const [phase, setPhase] = useState<Phase>({ name: "intro" });
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef(false);
  // Senaste svaren, så att klockan kan lämna in dem utan att vänta på en omritning.
  const answersRef = useRef<(number | null)[]>([]);
  const updateAnswers = (next: (number | null)[]) => {
    answersRef.current = next;
    setAnswers(next);
  };

  const poolById = useMemo(() => new Map(pool.map((q) => [q.id, q])), [pool]);

  // ---------- Lämna in ----------
  const submit = useCallback(
    async (questions: PracticeQuestion[], finalAnswers: (number | null)[], startedAt: number, timedOut: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      const finishedAt = Date.now();
      const result = gradeExam(questions, finalAnswers, passThreshold);
      const used = usedSeconds(startedAt, finishedAt, timeLimitSeconds);
      writeStorage(storageKey, null);
      setPhase({ name: "result", questions, answers: finalAnswers, result, usedSeconds: used, timedOut, saveFailed: false });
      window.scrollTo({ top: 0 });

      if (preview) return;
      const ok = await saveAttempt({ questions, answers: finalAnswers, result, startedAt, used, timedOut, timeLimitSeconds, country });
      if (!ok) setPhase((p) => (p.name === "result" ? { ...p, saveFailed: true } : p));
    },
    [passThreshold, timeLimitSeconds, storageKey, preview, country],
  );

  // ---------- Starta / återuppta ----------
  function start() {
    const questions = pickExamQuestions(pool, questionCount);
    const startedAt = currentTime();
    const deadline = startedAt + timeLimitSeconds * 1000;
    const empty = questions.map(() => null);
    submitted.current = false;
    updateAnswers(empty);
    setIndex(0);
    setNow(startedAt);
    setPhase({ name: "running", questions, startedAt, deadline, resumed: false });
    writeStorage(storageKey, { questionIds: questions.map((q) => q.id), answers: empty, startedAt, deadline });
    window.scrollTo({ top: 0 });
  }

  // Finns ett pågående prov sparat? Fortsätt det, eller lämna in om tiden redan är slut.
  useEffect(() => {
    const saved = readStorage(storageKey);
    if (!saved) return;
    const questions = saved.questionIds.map((id) => poolById.get(id));
    if (questions.some((q) => !q) || saved.answers.length !== questions.length) {
      writeStorage(storageKey, null);
      return;
    }
    const qs = questions as PracticeQuestion[];
    /* eslint-disable react-hooks/set-state-in-effect -- engångsåterställning från webbläsarens lagring */
    answersRef.current = saved.answers;
    setAnswers(saved.answers);
    if (isTimeUp(saved.deadline, currentTime())) {
      void submit(qs, saved.answers, saved.startedAt, true);
    } else {
      setPhase({ name: "running", questions: qs, startedAt: saved.startedAt, deadline: saved.deadline, resumed: true });
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, poolById, submit]);

  // ---------- Klockan ----------
  // Tickar varannan halvsekund och lämnar in automatiskt när tiden är slut.
  const running = phase.name === "running";
  useEffect(() => {
    if (phase.name !== "running") return;
    const { deadline, questions, startedAt } = phase;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (isTimeUp(deadline, t)) void submit(questions, answersRef.current, startedAt, true);
    };
    const id = setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, submit]);

  // Varna innan man lämnar sidan mitt i provet.
  useEffect(() => {
    if (!running) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [running]);

  // ---------- Vyer ----------
  if (phase.name === "intro") {
    const minutes = Math.round(timeLimitSeconds / 60);
    const n = Math.min(questionCount, pool.length);
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-extrabold">Provsimulering</h1>
        <ul className="space-y-3 rounded-2xl border border-line bg-surface p-5">
          <li>
            <strong>{n} frågor</strong> från alla kapitel, med fyra svarsalternativ.
          </li>
          <li>
            <strong>{minutes} minuter.</strong> Klockan går även om du stänger sidan.
          </li>
          <li>Du kan byta svar och hoppa mellan frågorna tills du lämnar in.</li>
          <li>
            <strong>Du ser resultatet först när du lämnat in</strong>, precis som på riktigt.
          </li>
        </ul>
        {pool.length < questionCount && (
          <p className="rounded-xl bg-cta-soft p-3 text-sm text-cta-dark">
            Just nu finns {pool.length} frågor, så provet blir kortare än det riktiga ({questionCount} frågor).
          </p>
        )}
        <p className="text-sm text-muted">
          Det här är en övning. Antal frågor och tid bygger på de uppgifter vi har om provet. Kontrollera alltid
          aktuell information hos UHR.
        </p>
        <button
          type="button"
          onClick={start}
          disabled={pool.length === 0}
          className="w-full rounded-full bg-cta px-6 py-4 text-lg font-bold text-white hover:bg-cta-dark disabled:opacity-50"
        >
          Starta provet
        </button>
      </div>
    );
  }

  if (phase.name === "result") {
    return (
      <ExamResultView
        result={phase.result}
        questions={phase.questions}
        answers={phase.answers}
        chapters={chapters}
        usedSeconds={phase.usedSeconds}
        timedOut={phase.timedOut}
        officialInfoUrl={officialInfoUrl}
        saveFailed={phase.saveFailed}
        onRestart={() => setPhase({ name: "intro" })}
      />
    );
  }

  // ---------- Pågående prov ----------
  const { questions, deadline, startedAt } = phase;
  const question = questions[index];
  const left = remainingMs(deadline, now);
  const warning = timeWarning(left);
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLast = index === questions.length - 1;

  function choose(option: number) {
    const next = answers.map((a, i) => (i === index ? option : a));
    updateAnswers(next);
    const saved = readStorage(storageKey);
    if (saved) writeStorage(storageKey, { ...saved, answers: next });
  }

  function go(to: number) {
    setIndex(Math.max(0, Math.min(questions.length - 1, to)));
    setShowOverview(false);
    window.scrollTo({ top: 0 });
  }

  function handIn() {
    const missing = questions.length - answeredCount;
    if (missing > 0 && !window.confirm(`Du har ${missing} obesvarade frågor. Vill du lämna in ändå?`)) return;
    void submit(questions, answers, startedAt, false);
  }

  return (
    <div className="pb-28">
      {/* Klocka och förlopp – alltid synliga */}
      <div className="sticky top-14 z-10 -mx-4 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <span
            role="timer"
            aria-label={`Tid kvar: ${formatClock(left)}`}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-lg font-bold tabular-nums ${
              warning === "normal" ? "bg-primary-soft text-primary" : warning === "low" ? "bg-cta-soft text-cta-dark" : "animate-pulse bg-cta text-white"
            }`}
          >
            <Clock size={18} aria-hidden /> {formatClock(left)}
          </span>
          <span className="text-sm font-semibold text-muted">
            Fråga {index + 1} av {questions.length}
          </span>
          <button
            type="button"
            onClick={() => setShowOverview((v) => !v)}
            aria-expanded={showOverview}
            className="flex items-center gap-1 rounded-full border-2 border-line bg-surface px-3 py-1 text-sm font-semibold"
          >
            <LayoutGrid size={16} aria-hidden /> Översikt
          </button>
        </div>
        {phase.resumed && answeredCount === 0 && index === 0 && (
          <p className="mt-1 text-xs text-muted">Du fortsätter provet du startade tidigare.</p>
        )}
      </div>

      {showOverview ? (
        <div className="mt-5 space-y-4">
          <p className="font-semibold">
            {answeredCount} av {questions.length} besvarade
          </p>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Fråga ${i + 1}${answers[i] !== null ? ", besvarad" : ", obesvarad"}`}
                className={`aspect-square rounded-xl border-2 text-sm font-bold ${
                  answers[i] !== null ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface"
                } ${i === index ? "ring-2 ring-cta ring-offset-1" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handIn}
            className="w-full rounded-full bg-cta px-6 py-4 text-lg font-bold text-white hover:bg-cta-dark"
          >
            Lämna in provet
          </button>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <h2 lang="sv" className="text-xl leading-snug font-bold sm:text-2xl">
            {question.question}
          </h2>
          <div className="space-y-2" role="radiogroup" aria-label="Svarsalternativ">
            {question.options.map((option, i) => (
              <AnswerOption
                key={i}
                index={i}
                text={option}
                state={answers[index] === i ? "selected" : "idle"}
                onSelect={() => choose(i)}
              />
            ))}
          </div>
          {answers[index] !== null && (
            <p className="text-sm text-muted">
              Du har valt {LETTERS[answers[index]!]}. Du kan byta svar tills du lämnar in.
            </p>
          )}
        </div>
      )}

      {/* Navigering fäst längst ner */}
      {!showOverview && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 p-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              disabled={index === 0}
              className="rounded-full border-2 border-line bg-surface px-5 py-3 font-bold disabled:opacity-40"
            >
              <span className="rtl:hidden">←</span>
              <span className="hidden rtl:inline">→</span>
              <span className="sr-only">Föregående fråga</span>
            </button>
            {isLast ? (
              <button type="button" onClick={handIn} className="flex-1 rounded-full bg-cta px-6 py-3 text-lg font-bold text-white hover:bg-cta-dark">
                Lämna in
              </button>
            ) : (
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="flex-1 rounded-full bg-primary px-6 py-3 text-lg font-bold text-white hover:bg-primary-dark"
              >
                Nästa fråga
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Webbläsarens lagring (tål att den är avstängd) ----------
function readStorage(key: string): Saved | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: Saved | null) {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    // Privat läge eller full lagring: provet fungerar ändå, men överlever inte en omladdning.
  }
}

// ---------- Spara i databasen ----------
async function saveAttempt(args: {
  questions: PracticeQuestion[];
  answers: (number | null)[];
  result: ExamResult;
  startedAt: number;
  used: number;
  timedOut: boolean;
  timeLimitSeconds: number;
  country: string;
}): Promise<boolean> {
  const userId = await ensureUser();
  if (!userId) return false;
  const supabase = getBrowserClient();
  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .insert({
      country: args.country,
      question_count: args.result.total,
      correct_count: args.result.correct,
      duration_seconds: args.used,
      time_limit_seconds: args.timeLimitSeconds,
      timed_out: args.timedOut,
      started_at: new Date(args.startedAt).toISOString(),
    })
    .select("id")
    .single();
  if (error) {
    console.error("Kunde inte spara provet:", error.message);
    return false;
  }
  const rows = args.questions.flatMap((q, i) => {
    const a = args.answers[i];
    return a === null
      ? []
      : [{ question_id: q.id, selected_index: a, is_correct: a === q.correct_index, mode: "exam", exam_attempt_id: attempt.id }];
  });
  if (rows.length) {
    const res = await supabase.from("answers").insert(rows);
    if (res.error) {
      console.error("Kunde inte spara svaren:", res.error.message);
      return false;
    }
  }
  return true;
}
