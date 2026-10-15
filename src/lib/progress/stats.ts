/**
 * BERÄKNINGAR FÖR RESULTAT, REPETITION OCH FRAMSTEG
 * Rena funktioner utan databas, så att de kan testas noggrant.
 */

export type AnswerRow = {
  question_id: string;
  is_correct: boolean;
  answered_at: string;
  /** Frågans kapitel, eller null om frågan inte längre är tillgänglig. */
  chapter: number | null;
};

export type QuestionHistory = {
  questionId: string;
  chapter: number | null;
  /** Svaren i tidsordning, äldst först. */
  results: boolean[];
  lastAnsweredAt: string;
};

/** Samlar alla svar per fråga i tidsordning. */
export function buildHistories(rows: AnswerRow[]): Map<string, QuestionHistory> {
  const sorted = [...rows].sort((a, b) => a.answered_at.localeCompare(b.answered_at));
  const map = new Map<string, QuestionHistory>();
  for (const r of sorted) {
    const h = map.get(r.question_id) ?? { questionId: r.question_id, chapter: r.chapter, results: [], lastAnsweredAt: r.answered_at };
    h.results.push(r.is_correct);
    h.lastAnsweredAt = r.answered_at;
    h.chapter ??= r.chapter;
    map.set(r.question_id, h);
  }
  return map;
}

/** Antal rätt i rad i slutet av historiken. */
export function trailingCorrect(results: boolean[]): number {
  let n = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) n++;
  return n;
}

/** En fråga räknas som klarad om det senaste svaret var rätt. */
export function isMastered(h: QuestionHistory): boolean {
  return h.results.at(-1) === true;
}

/**
 * REPETERA FEL: frågor man någon gång svarat fel på och som inte har besvarats
 * rätt `streakNeeded` gånger i rad efter det senaste felet.
 * De som var längst sedan man övade kommer först.
 */
export function reviewQueue(histories: Iterable<QuestionHistory>, streakNeeded: number) {
  return [...histories]
    .filter((h) => h.results.includes(false) && trailingCorrect(h.results) < streakNeeded)
    .map((h) => ({ questionId: h.questionId, chapter: h.chapter, correctInRow: trailingCorrect(h.results) }))
    .sort((a, b) => a.correctInRow - b.correctInRow);
}

export type ChapterStats = {
  chapter: number;
  /** Antal tillgängliga frågor i kapitlet. */
  totalQuestions: number;
  /** Frågor där senaste svaret var rätt. */
  mastered: number;
  /** Frågor man har svarat på minst en gång. */
  attempted: number;
  /** Andel rätt av alla svar i kapitlet (0–1), eller null om inga svar. */
  accuracy: number | null;
  answers: number;
};

/** Framsteg och andel rätt per kapitel. */
export function chapterStats(
  histories: Iterable<QuestionHistory>,
  totalsByChapter: Map<number, number>,
): ChapterStats[] {
  const stats = new Map<number, { mastered: number; attempted: number; correct: number; answers: number }>();
  for (const h of histories) {
    if (h.chapter === null) continue;
    const s = stats.get(h.chapter) ?? { mastered: 0, attempted: 0, correct: 0, answers: 0 };
    s.attempted++;
    if (isMastered(h)) s.mastered++;
    s.answers += h.results.length;
    s.correct += h.results.filter(Boolean).length;
    stats.set(h.chapter, s);
  }
  return [...totalsByChapter.entries()]
    .sort(([a], [b]) => a - b)
    .map(([chapter, totalQuestions]) => {
      const s = stats.get(chapter) ?? { mastered: 0, attempted: 0, correct: 0, answers: 0 };
      return {
        chapter,
        totalQuestions,
        // Kan inte bli fler än antalet frågor, även om frågor tagits bort.
        mastered: Math.min(s.mastered, totalQuestions),
        attempted: Math.min(s.attempted, totalQuestions),
        accuracy: s.answers ? s.correct / s.answers : null,
        answers: s.answers,
      };
    });
}

/**
 * Kapitel man bör plugga mer på: först de med lägst andel rätt (minst
 * `minAnswers` svar), därefter kapitel man inte har övat på alls.
 */
export function chaptersToStudy(stats: ChapterStats[], limit = 3, minAnswers = 3): number[] {
  const weak = stats
    .filter((s) => s.accuracy !== null && s.answers >= minAnswers && s.accuracy < 0.8)
    .sort((a, b) => a.accuracy! - b.accuracy!)
    .map((s) => s.chapter);
  const untouched = stats.filter((s) => s.answers === 0 && s.totalQuestions > 0).map((s) => s.chapter);
  return [...weak, ...untouched].slice(0, limit);
}

/** Totalt antal svar och andel rätt. */
export function overallAccuracy(rows: Pick<AnswerRow, "is_correct">[]) {
  const correct = rows.filter((r) => r.is_correct).length;
  return { correct, total: rows.length, share: rows.length ? correct / rows.length : null };
}

/** Datum ("2026-10-15") i en viss tidszon. */
export function dayKey(iso: string | Date, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

function previousDay(key: string): string {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * DAGAR I RAD: antal dagar i följd med minst ett svar, räknat bakåt från i dag.
 * Har man inte övat i dag men i går, räknas serien fortfarande (man har hela dagen på sig).
 */
export function dayStreak(answeredAt: string[], now: Date, timeZone: string): { current: number; practicedToday: boolean } {
  const days = new Set(answeredAt.map((a) => dayKey(a, timeZone)));
  const today = dayKey(now, timeZone);
  const practicedToday = days.has(today);
  let day = practicedToday ? today : previousDay(today);
  let current = 0;
  while (days.has(day)) {
    current++;
    day = previousDay(day);
  }
  return { current, practicedToday };
}
