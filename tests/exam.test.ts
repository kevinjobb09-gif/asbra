import { describe, expect, it } from "vitest";
import { formatClock, isTimeUp, remainingMs, timeWarning, usedSeconds } from "@/lib/exam/timer";
import { gradeExam, pickExamQuestions } from "@/lib/exam/exam";
import type { PracticeQuestion } from "@/lib/practice/session";

const MIN = 60_000;

describe("nedräkning", () => {
  const start = 1_000_000;
  const deadline = start + 90 * MIN;

  it("räknar mot sluttiden", () => {
    expect(remainingMs(deadline, start)).toBe(90 * MIN);
    expect(remainingMs(deadline, start + 30 * MIN)).toBe(60 * MIN);
  });

  it("blir aldrig negativ", () => {
    expect(remainingMs(deadline, deadline + 5000)).toBe(0);
  });

  it("tiden är slut exakt vid sluttiden, inte före", () => {
    expect(isTimeUp(deadline, deadline - 1)).toBe(false);
    expect(isTimeUp(deadline, deadline)).toBe(true);
    expect(isTimeUp(deadline, deadline + 1)).toBe(true);
  });

  it("stämmer även om fliken legat i bakgrunden länge", () => {
    // Inget räknas sekund för sekund – bara klockslaget spelar roll.
    expect(remainingMs(deadline, start + 89 * MIN + 59_000)).toBe(1000);
  });
});

describe("visning av klockan", () => {
  it("visar timmar när det är minst en timme kvar", () => {
    expect(formatClock(90 * MIN)).toBe("1:30:00");
    expect(formatClock(60 * MIN)).toBe("1:00:00");
  });

  it("visar minuter och sekunder under en timme", () => {
    expect(formatClock(59 * MIN + 59_000)).toBe("59:59");
    expect(formatClock(65_000)).toBe("1:05");
  });

  it("avrundar uppåt så att 0:00 bara visas när tiden är slut", () => {
    expect(formatClock(1)).toBe("0:01");
    expect(formatClock(999)).toBe("0:01");
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(-500)).toBe("0:00");
  });

  it("varnar när tiden börjar ta slut", () => {
    expect(timeWarning(30 * MIN)).toBe("normal");
    expect(timeWarning(10 * MIN)).toBe("low");
    expect(timeWarning(60_000)).toBe("critical");
    expect(timeWarning(0)).toBe("critical");
  });

  it("använd tid blir aldrig mer än tidsgränsen", () => {
    expect(usedSeconds(0, 125_400, 5400)).toBe(125);
    expect(usedSeconds(0, 999 * MIN, 5400)).toBe(5400);
  });
});

function q(id: string, chapter: number, correct = 0): PracticeQuestion {
  return {
    id,
    chapter,
    section: "",
    question: "?",
    options: ["a", "b", "c", "d"],
    correct_index: correct,
    explanation: "",
    source_reference: "",
  };
}

describe("urval av provfrågor", () => {
  it("ger exakt rätt antal frågor", () => {
    const pool = Array.from({ length: 200 }, (_, i) => q(`q${i}`, (i % 13) + 1));
    expect(pickExamQuestions(pool, 60)).toHaveLength(60);
  });

  it("fördelar frågorna efter kapitlens storlek", () => {
    const pool = [
      ...Array.from({ length: 60 }, (_, i) => q(`a${i}`, 1)),
      ...Array.from({ length: 30 }, (_, i) => q(`b${i}`, 2)),
      ...Array.from({ length: 30 }, (_, i) => q(`c${i}`, 3)),
    ];
    const picked = pickExamQuestions(pool, 60);
    const count = (ch: number) => picked.filter((x) => x.chapter === ch).length;
    expect([count(1), count(2), count(3)]).toEqual([30, 15, 15]);
  });

  it("ger inga dubbletter", () => {
    const pool = Array.from({ length: 100 }, (_, i) => q(`q${i}`, (i % 7) + 1));
    const picked = pickExamQuestions(pool, 60);
    expect(new Set(picked.map((x) => x.id)).size).toBe(60);
  });

  it("använder alla frågor om det finns färre än begärt", () => {
    const pool = Array.from({ length: 10 }, (_, i) => q(`q${i}`, 1));
    expect(pickExamQuestions(pool, 60)).toHaveLength(10);
  });
});

describe("rättning av provet", () => {
  const questions = [q("1", 1, 0), q("2", 1, 1), q("3", 2, 2), q("4", 2, 3)];

  it("räknar rätt svar", () => {
    const r = gradeExam(questions, [0, 1, 2, 3], null);
    expect(r).toMatchObject({ correct: 4, total: 4, unanswered: 0, share: 1 });
  });

  it("obesvarade frågor räknas som fel", () => {
    const r = gradeExam(questions, [0, null, null, 0], null);
    expect(r).toMatchObject({ correct: 1, unanswered: 2 });
  });

  it("visar resultat per kapitel", () => {
    const r = gradeExam(questions, [0, 0, 2, 0], null);
    expect(r.byChapter).toEqual([
      { chapter: 1, correct: 1, total: 2 },
      { chapter: 2, correct: 1, total: 2 },
    ]);
  });

  it("säger inget om godkänt när gränsen inte är fastställd", () => {
    expect(gradeExam(questions, [0, 1, 2, 3], null).passed).toBeNull();
  });

  it("godkänt när andelen rätt når gränsen", () => {
    expect(gradeExam(questions, [0, 1, 2, 0], 0.75).passed).toBe(true);
    expect(gradeExam(questions, [0, 1, 0, 0], 0.75).passed).toBe(false);
  });

  it("avvisar ogiltiga svar och fel antal svar", () => {
    expect(() => gradeExam(questions, [0, 1, 2], null)).toThrow();
    expect(() => gradeExam(questions, [0, 1, 2, 7], null)).toThrow();
  });
});
