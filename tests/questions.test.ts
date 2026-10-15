import { describe, expect, it } from "vitest";
import { questionInputFromFormData, questionInputSchema } from "@/lib/questions/schema";
import { shuffleOptions } from "@/lib/questions/shuffle";

const valid = {
  country: "se",
  chapter: 2,
  section: "2.1",
  question: "Vem är Sveriges statschef?",
  options: ["Statsministern", "Kungen", "Talmannen", "Justitiekanslern"],
  correct_index: 1,
  explanation: "Kungen är statschef men har ingen politisk makt.",
  source_reference: "Sverige i fokus, kapitel 2, avsnitt 2.1",
  difficulty: 2,
  status: "reviewed",
};

describe("frågeregler", () => {
  it("godkänner en korrekt fråga", () => {
    expect(questionInputSchema.safeParse(valid).success).toBe(true);
  });

  it("kräver exakt fyra svarsalternativ", () => {
    expect(questionInputSchema.safeParse({ ...valid, options: ["a", "b", "c"] }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...valid, options: ["a", "b", "c", "d", "e"] }).success).toBe(false);
  });

  it("rätt svar måste peka på ett av de fyra alternativen", () => {
    expect(questionInputSchema.safeParse({ ...valid, correct_index: 4 }).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...valid, correct_index: -1 }).success).toBe(false);
  });

  it("stoppar två likadana svarsalternativ", () => {
    const r = questionInputSchema.safeParse({ ...valid, options: ["Kungen", "kungen", "Talmannen", "JK"] });
    expect(r.success).toBe(false);
  });

  it("kräver källhänvisning", () => {
    expect(questionInputSchema.safeParse({ ...valid, source_reference: "" }).success).toBe(false);
  });

  it("en exempelfråga kan inte markeras som granskad förrän källan är ifylld", () => {
    const placeholder = { ...valid, source_reference: "EXEMPEL – kontrollera kapitel" };
    expect(questionInputSchema.safeParse(placeholder).success).toBe(false);
    expect(questionInputSchema.safeParse({ ...placeholder, status: "draft" }).success).toBe(true);
  });

  it("stoppar kapitel som inte finns", () => {
    expect(questionInputSchema.safeParse({ ...valid, chapter: 14 }).success).toBe(false);
  });

  it("läser formulärdata från adminsidan", () => {
    const fd = new FormData();
    Object.entries({ ...valid, chapter: "2", correct_index: "1" }).forEach(([k, v]) => {
      if (k !== "options") fd.set(k, String(v));
    });
    valid.options.forEach((o, i) => fd.set(`option${i}`, o));
    const r = questionInputSchema.safeParse(questionInputFromFormData(fd, "draft"));
    expect(r.success).toBe(true);
    expect(r.data?.status).toBe("draft");
    expect(r.data?.correct_index).toBe(1);
  });
});

describe("blandning av svarsalternativ", () => {
  it("rätt svar följer med när alternativen blandas", () => {
    const options = ["A", "B", "C", "D"];
    for (let seed = 0; seed < 50; seed++) {
      let s = seed;
      const random = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
      const r = shuffleOptions(options, 2, random);
      expect(r.options[r.correctIndex]).toBe("C");
      expect([...r.options].sort()).toEqual(options);
    }
  });
});
