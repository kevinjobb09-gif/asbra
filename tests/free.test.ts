import { describe, expect, it } from "vitest";
import { freeQuestionsLeft, pickFreeQuestions } from "@/lib/practice/free";
import type { PracticeQuestion } from "@/lib/practice/session";

function makePool(perChapter: Record<number, number>): PracticeQuestion[] {
  return Object.entries(perChapter).flatMap(([chapter, n]) =>
    Array.from({ length: n }, (_, i) => ({
      id: `k${chapter}-${i}`,
      chapter: Number(chapter),
      section: "",
      question: "?",
      options: ["a", "b", "c", "d"],
      correct_index: 0,
      explanation: "",
      source_reference: "",
    })),
  );
}

describe("urval av gratisfrågor", () => {
  it("ger aldrig fler än begärt", () => {
    expect(pickFreeQuestions(makePool({ 1: 20, 2: 20 }), new Set(), 30)).toHaveLength(30);
  });

  it("sprider frågorna över kapitlen", () => {
    const picked = pickFreeQuestions(makePool({ 1: 10, 2: 10, 3: 10, 4: 10 }), new Set(), 8);
    const chapters = picked.map((q) => q.chapter);
    for (const ch of [1, 2, 3, 4]) expect(chapters.filter((c) => c === ch)).toHaveLength(2);
  });

  it("hoppar över frågor man redan svarat på", () => {
    const pool = makePool({ 1: 3 });
    const picked = pickFreeQuestions(pool, new Set(["k1-0", "k1-1"]), 30);
    expect(picked.map((q) => q.id)).toEqual(["k1-2"]);
  });

  it("ger inga dubbletter", () => {
    const picked = pickFreeQuestions(makePool({ 1: 5, 2: 1 }), new Set(), 6);
    expect(new Set(picked.map((q) => q.id)).size).toBe(picked.length);
  });

  it("ger inget när gratisfrågorna är slut", () => {
    expect(pickFreeQuestions(makePool({ 1: 5 }), new Set(), 0)).toEqual([]);
  });
});

describe("antal gratisfrågor kvar", () => {
  it("räknar ner och blir aldrig negativt", () => {
    expect(freeQuestionsLeft(0, 30)).toBe(30);
    expect(freeQuestionsLeft(29, 30)).toBe(1);
    expect(freeQuestionsLeft(30, 30)).toBe(0);
    expect(freeQuestionsLeft(45, 30)).toBe(0);
  });
});
