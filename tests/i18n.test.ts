import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANGUAGE_CODES } from "@/config";
import { sv } from "@/i18n/messages/sv";
import { createTranslator, interpolate, withFallback } from "@/i18n/translate";
import { pickFromAcceptLanguage } from "@/i18n/server";

/** Alla nycklar i ett textobjekt, t.ex. "home.title". */
function keys(obj: unknown, prefix = ""): string[] {
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

/** Hämtar en text via nyckeln "a.b.c". */
function get(obj: unknown, key: string): string | undefined {
  let node: unknown = obj;
  for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === "string" ? node : undefined;
}

function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

describe("översättning", () => {
  it("byter ut {platshållare}", () => {
    expect(interpolate("Fråga {i} av {n}", { i: 3, n: 30 })).toBe("Fråga 3 av 30");
    expect(interpolate("Okänd {x}", {})).toBe("Okänd {x}");
  });

  it("saknade texter visas på svenska", () => {
    const merged = withFallback({ home: { ctaFree: "Start practicing for free" } });
    const t = createTranslator(merged);
    expect(t("home.ctaFree")).toBe("Start practicing for free");
    expect(t("home.priceTitle")).toBe(sv.home.priceTitle);
  });

  it("tomma texter ersätts med svenska", () => {
    const t = createTranslator(withFallback({ home: { ctaFree: "  " } }));
    expect(t("home.ctaFree")).toBe(sv.home.ctaFree);
  });
});

describe("val av språk från webbläsaren", () => {
  it("väljer det språk användaren föredrar", () => {
    expect(pickFromAcceptLanguage("ar-SY,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(pickFromAcceptLanguage("en-US;q=0.5,fa;q=0.9")).toBe("fa");
  });

  it("dari skickas som fa-AF", () => {
    expect(pickFromAcceptLanguage("fa-AF")).toBe("prs");
  });

  it("kroatiska och serbiska visas på bosniska, okända språk på svenska", () => {
    expect(pickFromAcceptLanguage("hr-HR")).toBe("bs");
    expect(pickFromAcceptLanguage("sr")).toBe("bs");
    expect(pickFromAcceptLanguage("ja-JP")).toBe("sv");
    expect(pickFromAcceptLanguage(null)).toBe("sv");
  });
});

describe("översättningsfilerna", () => {
  const svKeys = keys(sv).sort();
  const svByKey = new Map(svKeys.map((k) => [k, get(sv, k)!]));

  for (const code of LANGUAGE_CODES.filter((c) => c !== "sv")) {
    const file = `src/i18n/messages/${code}.json`;
    it(`${code}: filen finns, har alla texter och samma platshållare`, () => {
      expect(existsSync(file), `${file} saknas`).toBe(true);
      const messages = JSON.parse(readFileSync(file, "utf8"));
      const own = keys(messages).sort();
      const missing = svKeys.filter((k) => !own.includes(k));
      expect(missing, `saknas i ${code}`).toEqual([]);
      for (const k of svKeys) {
        const text = get(messages, k) ?? "";
        expect(placeholders(text), `${code}: ${k}`).toEqual(placeholders(svByKey.get(k)!));
      }
    });
  }
});

import { languagePageTarget } from "@/components/LanguagePicker";

describe("byte av språk", () => {
  it("på en språksida går man till det nya språkets startsida", () => {
    expect(languagePageTarget("/ar", "sv")).toBe("/");
    expect(languagePageTarget("/ar", "fa")).toBe("/fa");
    expect(languagePageTarget("/ar/", "en")).toBe("/en");
  });

  it("på startsidan går man till språksidan", () => {
    expect(languagePageTarget("/", "ar")).toBe("/ar");
    expect(languagePageTarget("/", "sv")).toBe("/");
  });

  it("på andra sidor stannar man kvar", () => {
    expect(languagePageTarget("/ova", "ar")).toBeNull();
    expect(languagePageTarget("/om", "sv")).toBeNull();
    expect(languagePageTarget("/ova/kapitel/1", "fa")).toBeNull();
  });
});
