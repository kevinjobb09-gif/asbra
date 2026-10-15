import { shuffle, type PracticeQuestion } from "@/lib/practice/session";

/**
 * Väljer frågor till ett provtest. Antalet frågor från varje kapitel står i
 * proportion till hur många frågor kapitlet har, så att provet täcker hela
 * materialet. Finns det färre frågor än begärt används alla.
 */
export function pickExamQuestions(
  pool: PracticeQuestion[],
  count: number,
  random: () => number = Math.random,
): PracticeQuestion[] {
  if (pool.length <= count) return shuffle(pool, random);

  const byChapter = new Map<number, PracticeQuestion[]>();
  for (const q of shuffle(pool, random)) {
    byChapter.set(q.chapter, [...(byChapter.get(q.chapter) ?? []), q]);
  }

  // Största-rest-metoden: dela ut platser proportionellt och fördela resten rättvist.
  const chapters = [...byChapter.entries()].map(([chapter, qs]) => {
    const exact = (qs.length / pool.length) * count;
    return { chapter, qs, take: Math.floor(exact), rest: exact - Math.floor(exact) };
  });
  let left = count - chapters.reduce((sum, c) => sum + c.take, 0);
  for (const c of [...chapters].sort((a, b) => b.rest - a.rest)) {
    if (left === 0) break;
    if (c.take < c.qs.length) {
      c.take++;
      left--;
    }
  }

  return shuffle(
    chapters.flatMap((c) => c.qs.slice(0, c.take)),
    random,
  );
}

export type ExamResult = {
  correct: number;
  total: number;
  unanswered: number;
  share: number;
  /** Godkänd enligt konfigurationen, eller null om gränsen inte är fastställd. */
  passed: boolean | null;
  byChapter: { chapter: number; correct: number; total: number }[];
};

/**
 * RÄTTNING AV PROVET. `answers[i]` är valt alternativ för fråga i, eller null om obesvarad.
 * Obesvarade frågor räknas som fel.
 */
export function gradeExam(
  questions: Pick<PracticeQuestion, "chapter" | "correct_index" | "options">[],
  answers: (number | null)[],
  passThreshold: number | null,
): ExamResult {
  if (answers.length !== questions.length) {
    throw new Error("Antalet svar stämmer inte med antalet frågor.");
  }
  const chapters = new Map<number, { correct: number; total: number }>();
  let correct = 0;
  let unanswered = 0;

  questions.forEach((q, i) => {
    const a = answers[i];
    if (a !== null && (!Number.isInteger(a) || a < 0 || a >= q.options.length)) {
      throw new Error(`Ogiltigt svar på fråga ${i + 1}: ${a}`);
    }
    const isCorrect = a === q.correct_index;
    if (a === null) unanswered++;
    if (isCorrect) correct++;
    const c = chapters.get(q.chapter) ?? { correct: 0, total: 0 };
    c.total++;
    if (isCorrect) c.correct++;
    chapters.set(q.chapter, c);
  });

  const total = questions.length;
  const share = total ? correct / total : 0;
  return {
    correct,
    total,
    unanswered,
    share,
    passed: passThreshold === null ? null : share >= passThreshold,
    byChapter: [...chapters.entries()].sort(([a], [b]) => a - b).map(([chapter, c]) => ({ chapter, ...c })),
  };
}
