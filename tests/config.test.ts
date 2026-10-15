import { describe, expect, it } from "vitest";
import { brand, countries, formatPrice, getCountry, isRtl, languages } from "@/config";

describe("konfiguration", () => {
  it("alla länder har rimliga provinställningar", () => {
    for (const c of Object.values(countries)) {
      expect(c.exam.questionCount).toBeGreaterThan(0);
      expect(c.exam.durationMinutes).toBeGreaterThan(0);
      expect(c.exam.optionsPerQuestion).toBe(4);
      if (c.exam.passThreshold !== null) {
        expect(c.exam.passThreshold).toBeGreaterThan(0);
        expect(c.exam.passThreshold).toBeLessThanOrEqual(1);
      }
      expect(c.pricing.amount).toBeGreaterThan(0);
      expect(c.pricing.accessMonths).toBeGreaterThan(0);
      expect(c.freeQuestionLimit).toBeGreaterThan(0);
    }
  });

  it("Sverige har 13 kapitel numrerade 1–13", () => {
    expect(getCountry("se").chapters.map((ch) => ch.number)).toEqual(
      Array.from({ length: 13 }, (_, i) => i + 1),
    );
  });

  it("provspråket finns bland förklaringsspråken", () => {
    for (const c of Object.values(countries)) {
      expect(c.explanationLanguages).toContain(c.examLanguage);
    }
  });

  it("arabiska, persiska och dari visas höger till vänster, övriga inte", () => {
    const rtl = Object.values(languages).filter((l) => isRtl(l.code)).map((l) => l.code);
    expect(rtl.sort()).toEqual(["ar", "fa", "prs"]);
  });

  it("priset visas i kronor", () => {
    expect(formatPrice(getCountry("se")).replace(/\s/g, " ")).toBe("149 kr");
  });

  it("varumärkesnamnet finns på ett ställe och är ifyllt", () => {
    expect(brand.name.length).toBeGreaterThan(0);
    expect(brand.initial).toHaveLength(1);
  });
});
