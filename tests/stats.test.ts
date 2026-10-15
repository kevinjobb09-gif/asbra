import { describe, expect, it } from "vitest";
import {
  buildHistories,
  chapterStats,
  chaptersToStudy,
  dayKey,
  dayStreak,
  isMastered,
  overallAccuracy,
  reviewQueue,
  trailingCorrect,
  type AnswerRow,
} from "@/lib/progress/stats";

const TZ = "Europe/Stockholm";
let t = 0;
/** Skapar svar i tidsordning. */
function answers(questionId: string, chapter: number, results: boolean[]): AnswerRow[] {
  return results.map((is_correct) => ({
    question_id: questionId,
    chapter,
    is_correct,
    answered_at: new Date(Date.UTC(2026, 9, 1) + t++ * 1000).toISOString(),
  }));
}

describe("repetera fel", () => {
  it("en fråga man svarat fel på hamnar i listan", () => {
    const h = buildHistories(answers("a", 1, [false]));
    expect(reviewQueue(h.values(), 2).map((r) => r.questionId)).toEqual(["a"]);
  });

  it("frågan ligger kvar efter ett rätt svar …", () => {
    const h = buildHistories(answers("a", 1, [false, true]));
    expect(reviewQueue(h.values(), 2)).toEqual([{ questionId: "a", chapter: 1, correctInRow: 1 }]);
  });

  it("… och försvinner efter två rätt i rad", () => {
    const h = buildHistories(answers("a", 1, [false, true, true]));
    expect(reviewQueue(h.values(), 2)).toEqual([]);
  });

  it("ett nytt fel nollställer serien", () => {
    const h = buildHistories(answers("a", 1, [false, true, false, true]));
    expect(reviewQueue(h.values(), 2)[0].correctInRow).toBe(1);
  });

  it("frågor man alltid svarat rätt på är inte med", () => {
    const h = buildHistories(answers("a", 1, [true, true]));
    expect(reviewQueue(h.values(), 2)).toEqual([]);
  });

  it("svar i fel ordning sorteras efter tid", () => {
    const rows = answers("a", 1, [false, true, true]).reverse();
    const h = buildHistories(rows);
    expect(h.get("a")!.results).toEqual([false, true, true]);
  });

  it("räknar rätt i rad i slutet", () => {
    expect(trailingCorrect([true, false, true, true])).toBe(2);
    expect(trailingCorrect([])).toBe(0);
  });
});

describe("framsteg per kapitel", () => {
  const rows = [
    ...answers("a", 1, [false, true]), // klarad
    ...answers("b", 1, [true, false]), // inte klarad
    ...answers("c", 2, [true]), // klarad
  ];
  const h = buildHistories(rows);
  const totals = new Map([
    [1, 10],
    [2, 4],
    [3, 5],
  ]);
  const stats = chapterStats(h.values(), totals);

  it("räknar klarade frågor där senaste svaret var rätt", () => {
    expect(isMastered(h.get("a")!)).toBe(true);
    expect(isMastered(h.get("b")!)).toBe(false);
    expect(stats.find((s) => s.chapter === 1)).toMatchObject({ mastered: 1, attempted: 2, totalQuestions: 10, accuracy: 0.5 });
  });

  it("kapitel utan svar har ingen andel rätt", () => {
    expect(stats.find((s) => s.chapter === 3)).toMatchObject({ mastered: 0, accuracy: null });
  });

  it("föreslår svaga kapitel först och sedan kapitel man inte övat på", () => {
    const more = buildHistories([
      ...rows,
      ...answers("d", 2, [true, true]),
      ...answers("e", 1, [false]),
    ]);
    expect(chaptersToStudy(chapterStats(more.values(), totals))).toEqual([1, 3]);
  });

  it("andel rätt totalt", () => {
    expect(overallAccuracy(rows)).toEqual({ correct: 3, total: 5, share: 0.6 });
    expect(overallAccuracy([]).share).toBeNull();
  });
});

describe("dagar i rad", () => {
  const at = (iso: string) => new Date(iso).toISOString();

  it("räknar dagar i följd fram till i dag", () => {
    const streak = dayStreak(
      [at("2026-10-13T08:00:00+02:00"), at("2026-10-14T20:00:00+02:00"), at("2026-10-15T07:00:00+02:00")],
      new Date("2026-10-15T12:00:00+02:00"),
      TZ,
    );
    expect(streak).toEqual({ current: 3, practicedToday: true });
  });

  it("serien lever kvar om man övade i går men inte än i dag", () => {
    const streak = dayStreak([at("2026-10-14T10:00:00+02:00")], new Date("2026-10-15T09:00:00+02:00"), TZ);
    expect(streak).toEqual({ current: 1, practicedToday: false });
  });

  it("serien bryts om man missar en dag", () => {
    const streak = dayStreak([at("2026-10-13T10:00:00+02:00")], new Date("2026-10-15T09:00:00+02:00"), TZ);
    expect(streak.current).toBe(0);
  });

  it("använder svensk tid, inte UTC (23:30 svensk tid är samma dag)", () => {
    expect(dayKey("2026-10-15T21:30:00Z", TZ)).toBe("2026-10-15");
    expect(dayKey("2026-10-15T22:30:00Z", TZ)).toBe("2026-10-16");
  });

  it("flera svar samma dag räknas som en dag", () => {
    const streak = dayStreak(
      [at("2026-10-15T08:00:00+02:00"), at("2026-10-15T09:00:00+02:00")],
      new Date("2026-10-15T12:00:00+02:00"),
      TZ,
    );
    expect(streak.current).toBe(1);
  });

  it("klarar övergången till vintertid", () => {
    const streak = dayStreak(
      [at("2026-10-24T12:00:00+02:00"), at("2026-10-25T12:00:00+01:00"), at("2026-10-26T12:00:00+01:00")],
      new Date("2026-10-26T18:00:00+01:00"),
      TZ,
    );
    expect(streak.current).toBe(3);
  });
});
