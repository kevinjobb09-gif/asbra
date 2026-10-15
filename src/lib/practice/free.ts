import { shuffle, type PracticeQuestion } from "./session";

/**
 * Väljer gratisfrågor som användaren inte har svarat på än, spridda över
 * kapitlen: en fråga från varje kapitel i tur och ordning, så att man får
 * smakprov på hela materialet.
 */
export function pickFreeQuestions(
  pool: PracticeQuestion[],
  answeredIds: Set<string>,
  count: number,
  random: () => number = Math.random,
): PracticeQuestion[] {
  if (count <= 0) return [];
  const byChapter = new Map<number, PracticeQuestion[]>();
  for (const q of shuffle(pool, random)) {
    if (answeredIds.has(q.id)) continue;
    const list = byChapter.get(q.chapter) ?? [];
    list.push(q);
    byChapter.set(q.chapter, list);
  }
  const queues = shuffle([...byChapter.values()], random);
  const picked: PracticeQuestion[] = [];
  while (picked.length < count && queues.some((q) => q.length > 0)) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) picked.push(next);
      if (picked.length === count) break;
    }
  }
  return picked;
}

/** Hur många gratisfrågor som återstår. */
export function freeQuestionsLeft(answeredCount: number, limit: number): number {
  return Math.max(0, limit - answeredCount);
}
