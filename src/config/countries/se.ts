import { LANGUAGE_CODES } from "../languages";
import type { CountryConfig } from "./types";

/**
 * SVERIGE – inställningar för provet och tjänsten.
 *
 * ⚠️ Provformatet nedan bygger på osäkra uppgifter. Kontrollera aktuella
 * uppgifter på UHR:s webbplats (uhr.se) och uppdatera `lastVerified`.
 */
export const se: CountryConfig = {
  code: "se",
  name: "Sverige",
  examLanguage: "sv",
  currency: "SEK",

  studyMaterial: {
    title: "Sverige i fokus",
    publisher: "UHR",
    url: "https://www.uhr.se",
  },

  unaffiliatedAuthorities: ["UHR", "Migrationsverket"],

  exam: {
    questionCount: 60,
    durationMinutes: 90,
    optionsPerQuestion: 4,
    passThreshold: null, // Inte officiellt fastställd enligt de uppgifter vi har.
    lastVerified: "EJ KONTROLLERAT",
    officialInfoUrl: "https://www.uhr.se",
  },

  pricing: {
    amount: 149,
    accessMonths: 6,
  },

  freeQuestionLimit: 30,

  reviewCorrectStreak: 2,

  timeZone: "Europe/Stockholm",

  // Alla språk i src/config/languages.ts. Ta bort ett språk här för att dölja det.
  explanationLanguages: [...LANGUAGE_CODES],

  // TODO: Byt ut mot de riktiga kapitelrubrikerna i Sverige i fokus.
  chapters: Array.from({ length: 13 }, (_, i) => ({
    number: i + 1,
    title: `Kapitel ${i + 1}`,
  })),
};
