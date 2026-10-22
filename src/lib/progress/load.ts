import "server-only";
import type { CountryConfig } from "@/config";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/user";
import { getReviewedCountsByChapter } from "@/lib/questions/public";
import {
  buildHistories,
  chapterStats,
  chaptersToStudy,
  dayStreak,
  overallAccuracy,
  reviewQueue,
  type AnswerRow,
} from "./stats";

export type ExamAttemptRow = {
  id: string;
  question_count: number;
  correct_count: number;
  duration_seconds: number;
  timed_out: boolean;
  finished_at: string;
};

/** Hämtar den inloggade användarens svar och räknar ut resultat och framsteg. */
export async function getMyProgress(country: CountryConfig, now = new Date()) {
  const supabase = await createClient();
  const [user, totals] = await Promise.all([getCurrentUser(), getReviewedCountsByChapter(country.code)]);
  const chapterTotals = new Map(country.chapters.map((c) => [c.number, totals.get(c.number) ?? 0]));

  let rows: AnswerRow[] = [];
  let exams: ExamAttemptRow[] = [];

  if (user) {
    // RLS: man får bara sina egna svar. Frågan kopplas med för att få kapitlet.
    const [answersRes, examsRes] = await Promise.all([
      supabase
        .from("answers")
        .select("question_id, is_correct, answered_at, questions(chapter, country)")
        .order("answered_at", { ascending: false })
        .limit(5000),
      supabase
        .from("exam_attempts")
        .select("id, question_count, correct_count, duration_seconds, timed_out, finished_at")
        .eq("country", country.code)
        .order("finished_at", { ascending: false })
        .limit(10),
    ]);
    if (answersRes.error) throw new Error(`Kunde inte hämta svar: ${answersRes.error.message}`);

    type Joined = { question_id: string; is_correct: boolean; answered_at: string; questions: { chapter: number; country: string } | null };
    rows = (answersRes.data as unknown as Joined[])
      .filter((r) => !r.questions || r.questions.country === country.code)
      .map((r) => ({
        question_id: r.question_id,
        is_correct: r.is_correct,
        answered_at: r.answered_at,
        chapter: r.questions?.chapter ?? null,
      }));
    exams = (examsRes.data ?? []) as ExamAttemptRow[];
  }

  const histories = buildHistories(rows);
  const stats = chapterStats(histories.values(), chapterTotals);
  return {
    hasData: rows.length > 0,
    overall: overallAccuracy(rows),
    streak: dayStreak(
      rows.map((r) => r.answered_at),
      now,
      country.timeZone,
    ),
    stats,
    toStudy: chaptersToStudy(stats),
    review: reviewQueue(histories.values(), country.reviewCorrectStreak),
    mastered: stats.reduce((sum, s) => sum + s.mastered, 0),
    totalQuestions: stats.reduce((sum, s) => sum + s.totalQuestions, 0),
    exams,
  };
}
