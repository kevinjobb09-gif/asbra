import { describe, expect, it } from "vitest";
import {
  gradeAnswer,
  initSession,
  optionState,
  sessionReducer,
  shuffle,
  summarize,
  type PracticeQuestion,
} from "@/lib/practice/session";

const q = (id: string, correct: number): PracticeQuestion => ({
  id,
  chapter: 1,
  section: "",
  question: `Fråga ${id}`,
  options: ["A", "B", "C", "D"],
  correct_index: correct,
  explanation: "Förklaring",
  source_reference: "Källa",
});

describe("rättning", () => {
  it("rätt alternativ ger rätt", () => {
    expect(gradeAnswer(q("1", 2), 2)).toBe(true);
  });

  it("alla andra alternativ ger fel", () => {
    for (const s of [0, 1, 3]) expect(gradeAnswer(q("1", 2), s)).toBe(false);
  });

  it("ogiltiga svar avvisas i stället för att räknas", () => {
    expect(() => gradeAnswer(q("1", 0), 4)).toThrow();
    expect(() => gradeAnswer(q("1", 0), -1)).toThrow();
    expect(() => gradeAnswer(q("1", 0), 1.5)).toThrow();
  });
});

describe("färg på svarsalternativ", () => {
  it("inget är färgat innan man svarat", () => {
    expect([0, 1, 2, 3].map((i) => optionState(i, null, 1))).toEqual(["idle", "idle", "idle", "idle"]);
  });

  it("rätt svar blir grönt när man svarat rätt", () => {
    expect([0, 1, 2, 3].map((i) => optionState(i, 1, 1))).toEqual(["dimmed", "correct", "dimmed", "dimmed"]);
  });

  it("vid fel svar blir valet rött och det rätta svaret grönt", () => {
    expect([0, 1, 2, 3].map((i) => optionState(i, 3, 1))).toEqual(["dimmed", "correct", "dimmed", "wrong"]);
  });
});

describe("övningspass", () => {
  const questions = [q("a", 0), q("b", 1), q("c", 2)];

  it("räknar rätt och fel genom ett helt pass", () => {
    let s = initSession(questions);
    s = sessionReducer(s, { type: "answer", selected: 0 }); // rätt
    s = sessionReducer(s, { type: "next" });
    s = sessionReducer(s, { type: "answer", selected: 3 }); // fel
    s = sessionReducer(s, { type: "next" });
    s = sessionReducer(s, { type: "answer", selected: 2 }); // rätt
    s = sessionReducer(s, { type: "next" });
    expect(s.finished).toBe(true);
    expect(summarize(s.results)).toEqual({ correct: 2, total: 3, share: 2 / 3 });
  });

  it("man kan inte ändra sitt svar", () => {
    let s = initSession(questions);
    s = sessionReducer(s, { type: "answer", selected: 3 });
    s = sessionReducer(s, { type: "answer", selected: 0 });
    expect(s.results).toEqual([{ questionId: "a", selected: 3, isCorrect: false }]);
  });

  it("man kan inte hoppa över en fråga utan att svara", () => {
    const s = sessionReducer(initSession(questions), { type: "next" });
    expect(s.index).toBe(0);
  });

  it("ett pass utan frågor är klart direkt", () => {
    expect(initSession([]).finished).toBe(true);
  });

  it("börja om nollställer resultaten", () => {
    let s = sessionReducer(initSession(questions), { type: "answer", selected: 0 });
    s = sessionReducer(s, { type: "restart", questions });
    expect(s.results).toEqual([]);
    expect(s.index).toBe(0);
  });
});

describe("blandning", () => {
  it("behåller alla frågor och ändrar inte originalet", () => {
    const list = [1, 2, 3, 4, 5];
    const mixed = shuffle(list);
    expect([...mixed].sort()).toEqual(list);
    expect(list).toEqual([1, 2, 3, 4, 5]);
  });
});
